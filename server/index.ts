import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import fs from "fs";
import path from "path";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("SIGTERM", () => {
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000);
});

process.on("SIGINT", () => {
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000);
});

const app = express();
const httpServer = createServer(app);

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

const MemoryStoreSession = MemoryStore(session);

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
    store: new MemoryStoreSession({ checkPeriod: 86400000 }),
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

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

const port = parseInt(process.env.PORT || "5000", 10);

(async () => {
  if (process.env.NODE_ENV === "production") {
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Internal Server Error:", err);
      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });

    serveStatic(app);
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  } else {
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
