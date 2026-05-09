// Vercel catch-all serverless function. All `/api/*` requests land here
// and are handed to the bundled Express app produced by `npm run build`
// (see `script/build.ts` → `dist/serverless.cjs`).
//
// Keep this file tiny — the real logic lives in the bundled server.
const handler = require("../dist/serverless.cjs");
module.exports = handler.default || handler;
