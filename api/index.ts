import app from "../server.js";

// Vercel expects an exported function or an exported express app.
// Since server.ts exports 'app', we just re-export it here.
export default app;
