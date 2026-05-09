'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
// Note: express-session removed — Vercel is stateless; board state is sent by client each request

const gameRouter = require('./routes/game');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── ASCII Art Startup Logo ─────────────────────────────────────────────────
const ASCII_LOGO = `
\x1b[36m
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
\x1b[35m   TriMind AI — Neural Strategy Arena
\x1b[33m       The Ultimate Battle Arena v1.0\x1b[0m
`;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ─── API Routes ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/game', gameRouter);
app.use('/api/stats', statsRouter);

// ─── Serve Frontend ─────────────────────────────────────────────────────────
// In Vercel, static files are usually handled by the 'public' or vercel.json config,
// but we keep this for local development.
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─── Local Dev: listen; Vercel Serverless: export ───────────────────────────
if (require.main === module) {
  // Running directly with `node backend/server.js` or `npm start`
  app.listen(PORT, () => {
    console.log(ASCII_LOGO);
    console.log(`\x1b[32m✓ TriMind AI server online at http://localhost:${PORT}\x1b[0m`);
    console.log(`\x1b[36m✓ API available at http://localhost:${PORT}/api\x1b[0m\n`);
  });
}

// Required by Vercel: export the Express app as a serverless function handler
module.exports = app;
