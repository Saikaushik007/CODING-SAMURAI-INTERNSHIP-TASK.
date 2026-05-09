'use strict';

const express = require('express');
const router = express.Router();
const { recordGame, getStats, resetStats } = require('../data/statsStore');

/**
 * GET /api/stats
 * Return current stats
 */
router.get('/', (req, res) => {
  res.json(getStats());
});

/**
 * POST /api/stats/record
 * Record a game result
 */
router.post('/record', (req, res) => {
  const { result, duration = 0, moveCount = 0, difficulty = 'hard' } = req.body;
  if (!['player', 'ai', 'draw'].includes(result)) {
    return res.status(400).json({ error: 'Invalid result. Use: player | ai | draw' });
  }
  const updated = recordGame(result, difficulty, duration, moveCount);
  res.json(updated);
});

/**
 * DELETE /api/stats/reset
 * Reset all stats
 */
router.delete('/reset', (req, res) => {
  resetStats();
  res.json({ success: true });
});

module.exports = router;
