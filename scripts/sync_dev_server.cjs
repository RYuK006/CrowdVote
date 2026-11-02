const fs = require('fs');
const path = require('path');

const devFile = path.join(__dirname, '..', 'server-dev.ts');
const prodFile = path.join(__dirname, '..', 'server.ts');

const prodCode = fs.readFileSync(prodFile, 'utf8');

// Replace the static Vite middleware section at the bottom of prodCode with the createViteServer dev middleware
const prodStaticBlock = `// --- VITE MIDDLEWARE ---
// In production on Vercel, static files are handled by vercel.json rewrites.
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Only listen locally, Vercel handles the serverless execution
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

export default app;`;

const devViteBlock = `// --- VITE DEV MIDDLEWARE ---
async function startDevServer() {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(\`🚀 CrowdVote Dev Server running on http://localhost:\${PORT}\`);
  });
}

startDevServer();

export default app;`;

// Also update import for Vite if needed
let newDevCode = prodCode.replace(prodStaticBlock, devViteBlock);
fs.writeFileSync(devFile, newDevCode, 'utf8');
console.log('server-dev.ts synchronized successfully with server.ts!');
