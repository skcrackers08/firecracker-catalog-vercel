import express, { type Request, Response, NextFunction, type Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    customerId?: number;
    staffId?: number;
    staffRole?: string;
    staffName?: string;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

function buildSessionStore() {
  // Vercel (and any other multi-instance / serverless) needs a shared store,
  // because in-process MemoryStore won't survive cold starts and won't be
  // shared across function invocations. Use Postgres-backed sessions whenever
  // we have a DATABASE_URL and we're running in production.
  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    const PgStore = connectPgSimple(session);
    return new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: "user_sessions",
    });
  }
  const MemoryStoreSession = MemoryStore(session);
  return new MemoryStoreSession({ checkPeriod: 86400000 });
}

/**
 * Build and configure the Express app (middleware + routes).
 *
 * This is split out so the same configured app can run as either:
 *   - A long-lived Node server (Replit / `node dist/index.cjs`)
 *   - A Vercel serverless function (api/[...path].js → dist/serverless.cjs)
 *
 * Routes are registered and any seeding effects fire exactly once per process.
 */
export async function createApp(): Promise<{ app: Express; httpServer: Server }> {
  const app = express();
  const httpServer = createServer(app);

  // Vercel sits behind a TLS-terminating proxy; secure cookies need this.
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    express.json({
      limit: "50mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Fail fast in production if SESSION_SECRET isn't set — a hard-coded
  // fallback would let anyone forge admin/customer sessions.
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET environment variable is required in production. " +
        "Set it in Vercel project settings (or Replit Secrets) before deploying."
    );
  }
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "sk-crackers-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      store: buildSessionStore(),
      // Only require HTTPS-only cookies when actually running behind HTTPS
      // (Vercel always is). On bare-HTTP Replit dev / `npm run start` we
      // keep secure=false so logins still work.
      cookie: {
        secure: !!process.env.VERCEL,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (reqPath.startsWith("/api")) {
        let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  return { app, httpServer };
}

// ---------------------------------------------------------------------------
// Long-lived Node entry (Replit dev + production). Skipped on Vercel; there
// the serverless wrapper (server/serverless.ts → api/[...path].js) imports
// `createApp` directly and never calls `listen`.
// ---------------------------------------------------------------------------
if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT || "5000", 10);

  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
  });

  (async () => {
    if (process.env.NODE_ENV === "production") {
      const { app, httpServer } = await createApp();
      serveStatic(app);

      process.on("SIGTERM", () => {
        httpServer.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 3000);
      });
      process.on("SIGINT", () => {
        httpServer.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 3000);
      });

      httpServer.listen({ port, host: "0.0.0.0" }, () => {
        log(`serving on port ${port}`);
      });
    } else {
      // Dev mode: stand the server up first so the preview is responsive,
      // then attach Vite middleware.
      const app = express();
      const httpServer = createServer(app);

      app.set("trust proxy", 1);
      app.use(
        express.json({
          limit: "50mb",
          verify: (req, _res, buf) => {
            req.rawBody = buf;
          },
        })
      );
      app.use(express.urlencoded({ limit: "50mb", extended: true }));
      app.use(
        session({
          secret: process.env.SESSION_SECRET || "sk-crackers-secret-key-2024",
          resave: false,
          saveUninitialized: false,
          store: buildSessionStore(),
          cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
        })
      );

      let appIsReady = false;
      let appReadyResolve!: () => void;
      const appReadyPromise = new Promise<void>((resolve) => {
        appReadyResolve = resolve;
      });

      const htmlTemplatePath = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );

      app.use((req: Request, res: Response, next: NextFunction) => {
        if (appIsReady) return next();

        if (req.path.startsWith("/api")) {
          appReadyPromise.then(next);
          return;
        }

        const ext = path.extname(req.path);
        const isHtmlRequest =
          req.method === "GET" && (!ext || ext === ".html");

        if (isHtmlRequest) {
          try {
            const template = fs.readFileSync(htmlTemplatePath, "utf-8");
            return res.status(200).set("Content-Type", "text/html").end(template);
          } catch {
            return res.status(200).send("<html><body>Loading...</body></html>");
          }
        }

        appReadyPromise.then(next);
      });

      process.on("SIGTERM", () => {
        httpServer.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 3000);
      });
      process.on("SIGINT", () => {
        httpServer.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 3000);
      });

      httpServer.listen({ port, host: "0.0.0.0" }, () => {
        log(`serving on port ${port}`);
      });

      await registerRoutes(httpServer, app);

      app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error("Internal Server Error:", err);
        if (res.headersSent) return next(err);
        return res.status(status).json({ message });
      });

      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
      appIsReady = true;
      appReadyResolve();

      log("Application fully ready");
    }
  })();
}
