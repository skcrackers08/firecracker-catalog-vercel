// Vercel serverless entry. Wraps the existing Express app as a single
// Node Server Function so we can ship the entire feature set (sessions,
// admin-pro, OTP, AI chat, transport bills, wallet, email, WhatsApp deep
// links) without rewriting every route.
//
// `api/[...path].js` requires this file and re-exports the handler.
import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "./index";

let appPromise: Promise<(req: IncomingMessage, res: ServerResponse) => void> | null = null;

function getHandler() {
  if (!appPromise) {
    appPromise = createApp().then(({ app }) => app as any);
  }
  return appPromise;
}

// Warm the app on module load so the first cold-start request doesn't pay
// for the full route registration + DB seed.
getHandler().catch((err) => {
  console.error("[serverless] Failed to initialise Express app:", err);
});

async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getHandler();
  return app(req, res);
}

// Use CommonJS exports so api/[...path].js can `require()` this directly.
// (esbuild bundles this file as CJS — see script/build.ts.)
module.exports = handler;
module.exports.default = handler;
