'use strict';

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

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
app.use(
  session({
    secret: 'trimind-secret-key-2025',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24h
  })
);

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/game', gameRouter);
app.use('/api/stats', statsRouter);

// ─── Serve Frontend ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(ASCII_LOGO);
  console.log(`\x1b[32m✓ TriMind AI server online at http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[36m✓ API available at http://localhost:${PORT}/api\x1b[0m\n`);
});
