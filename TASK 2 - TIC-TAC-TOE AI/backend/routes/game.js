'use strict';

const express = require('express');
const router  = express.Router();

const { isValidMove, applyMove, getGameStatus, createEmptyBoard } = require('../engine/gameLogic');
const { getBestMove } = require('../engine/minimax');
const { getContextualTaunt, getRandomTaunt } = require('../engine/aiPersonality');

const THINK_TIMES = {
  easy:   { min: 250, max: 600  },
  medium: { min: 500, max: 1000 },
  hard:   { min: 800, max: 1400 },
};
const randDelay = d => {
  const r = THINK_TIMES[d] || THINK_TIMES.hard;
  return Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
};

/* POST /api/game/new ────────────────────────────────────────────────── */
router.post('/new', (req, res) => {
  const { difficulty = 'hard', playerName = 'PLAYER', boardSize = 3 } = req.body;
  const size = parseInt(boardSize, 10) || 3;
  const board = createEmptyBoard(size);
  res.json({ board, taunt: getRandomTaunt('gameStart'), boardSize: size });
});

/* POST /api/game/move ─────────────────────────────────────────────────────── */
router.post('/move', (req, res) => {
  let { board, playerMove, difficulty = 'hard', playerSymbol = 'X', boardSize = 3 } = req.body;
  const size     = parseInt(boardSize, 10) || 3;
  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X';

  if (!Array.isArray(board) || !isValidMove(board, playerMove)) {
    return res.status(400).json({ error: 'Invalid move', playerMove, board });
  }

  let newBoard = applyMove(board, playerMove, playerSymbol);
  let status   = getGameStatus(newBoard, size);
  let aiMove   = null;

  if (status.status === 'playing') {
    aiMove   = getBestMove(newBoard, aiSymbol, playerSymbol, difficulty, size);
    if (aiMove !== -1 && aiMove !== null) {
      newBoard = applyMove(newBoard, aiMove, aiSymbol);
      status   = getGameStatus(newBoard, size);
    }
  }

  const taunt = getContextualTaunt(newBoard, aiMove, status.status, difficulty);

  res.json({
    board: newBoard, playerMove, aiMove,
    gameStatus: status.status, winPattern: status.pattern,
    taunt, thinkingTime: randDelay(difficulty),
  });
});

/* POST /api/game/ai-first ───────────────────────────────────────────────────
   When AI goes first (player chose O or toggled AI-first)                    */
router.post('/ai-first', (req, res) => {
  let { board, difficulty = 'hard', aiSymbol = 'O', playerSymbol = 'X', boardSize = 3 } = req.body;
  const size = parseInt(boardSize, 10) || 3;

  const aiMove = getBestMove(board, aiSymbol, playerSymbol, difficulty, size);
  let newBoard = board;
  if (aiMove !== -1 && aiMove !== null) newBoard = applyMove(board, aiMove, aiSymbol);

  const status = getGameStatus(newBoard, size);

  res.json({
    board: newBoard, aiMove,
    gameStatus: status.status, winPattern: status.pattern,
    taunt: getRandomTaunt('gameStart'), thinkingTime: randDelay(difficulty),
  });
});

/* POST /api/game/hint ───────────────────────────────────────────────────────
   Returns the best move for the human player (minimax from player POV)       */
router.post('/hint', (req, res) => {
  const { board, playerSymbol = 'X', boardSize = 3 } = req.body;
  const size     = parseInt(boardSize, 10) || 3;
  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X';

  // Run minimax as if player is the "AI" to find optimal move
  const hintMove = getBestMove(board, playerSymbol, aiSymbol, 'hard', size);

  res.json({ hintMove });
});

/* GET /api/game/state ──────────────────────────────────────────────── */
router.get('/state', (req, res) => {
  // Stateless — client maintains board state; return defaults only
  res.json({
    board:      createEmptyBoard(),
    difficulty: 'hard',
    playerName: 'PLAYER',
    boardSize:  3,
  });
});

module.exports = router;
