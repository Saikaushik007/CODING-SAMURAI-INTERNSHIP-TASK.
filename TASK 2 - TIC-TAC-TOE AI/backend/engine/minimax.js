'use strict';

const { checkWinner, isBoardFull, getEmptyCells, applyMove, getWinPatterns } = require('./gameLogic');

// ── Heuristic for larger boards ──────────────────────────────────────────────
function heuristic(board, aiSymbol, humanSymbol, size) {
  const patterns = getWinPatterns(size);
  let score = 0;
  for (const pattern of patterns) {
    const vals = pattern.map(i => board[i]);
    const aiCount  = vals.filter(v => v === aiSymbol).length;
    const humCount = vals.filter(v => v === humanSymbol).length;
    if (humCount === 0 && aiCount > 0) score += Math.pow(10, aiCount);
    if (aiCount === 0 && humCount > 0) score -= Math.pow(10, humCount);
  }
  return score;
}

// ── Core Minimax with Alpha-Beta Pruning ─────────────────────────────────────
function minimax(board, depth, isMaximizing, alpha, beta, aiSymbol, humanSymbol, size, maxDepth) {
  const result = checkWinner(board, size);
  if (result) {
    const base = result.winner === aiSymbol ? 100 : -100;
    return base - (isMaximizing ? depth : -depth);
  }
  if (isBoardFull(board)) return 0;
  if (maxDepth !== undefined && depth >= maxDepth) {
    return heuristic(board, aiSymbol, humanSymbol, size);
  }

  const emptyCells = getEmptyCells(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const idx of emptyCells) {
      const nb = applyMove(board, idx, aiSymbol);
      const score = minimax(nb, depth + 1, false, alpha, beta, aiSymbol, humanSymbol, size, maxDepth);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const idx of emptyCells) {
      const nb = applyMove(board, idx, humanSymbol);
      const score = minimax(nb, depth + 1, true, alpha, beta, aiSymbol, humanSymbol, size, maxDepth);
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ── Get Best Move ────────────────────────────────────────────────────────────
function getBestMove(board, aiSymbol, humanSymbol, difficulty = 'hard', size = 3) {
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0) return -1;

  // EASY: mostly random
  if (difficulty === 'easy') {
    if (Math.random() < 0.70) return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // MEDIUM: limited depth
  let maxDepth;
  if (difficulty === 'easy')   maxDepth = 2;
  else if (difficulty === 'medium') maxDepth = size === 3 ? 4 : 3;
  else maxDepth = size === 3 ? undefined : 5; // HARD: full for 3x3, depth-limited for larger

  // Medium: 50% random
  if (difficulty === 'medium' && Math.random() < 0.35) {
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  let bestScore = -Infinity;
  let bestMove  = emptyCells[0];

  // Shuffle for non-determinism at same score levels
  const shuffled = [...emptyCells].sort(() => Math.random() - 0.5);

  for (const idx of shuffled) {
    const nb    = applyMove(board, idx, aiSymbol);
    const score = minimax(nb, 0, false, -Infinity, Infinity, aiSymbol, humanSymbol, size, maxDepth);
    if (score > bestScore) { bestScore = score; bestMove = idx; }
  }
  return bestMove;
}

module.exports = { getBestMove, minimax };
