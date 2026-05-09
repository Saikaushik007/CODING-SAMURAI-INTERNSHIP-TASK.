'use strict';

// ── Win pattern generators for variable board sizes ──────────────────────────

function generateWinPatterns(size, winLen) {
  const patterns = [];
  // Rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLen; c++) {
      patterns.push(Array.from({ length: winLen }, (_, i) => r * size + c + i));
    }
  }
  // Columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLen; r++) {
      patterns.push(Array.from({ length: winLen }, (_, i) => (r + i) * size + c));
    }
  }
  // Diagonals TL→BR
  for (let r = 0; r <= size - winLen; r++) {
    for (let c = 0; c <= size - winLen; c++) {
      patterns.push(Array.from({ length: winLen }, (_, i) => (r + i) * size + (c + i)));
    }
  }
  // Diagonals TR→BL
  for (let r = 0; r <= size - winLen; r++) {
    for (let c = winLen - 1; c < size; c++) {
      patterns.push(Array.from({ length: winLen }, (_, i) => (r + i) * size + (c - i)));
    }
  }
  return patterns;
}

// Cache patterns for standard board sizes
const PATTERN_CACHE = {
  '3-3': generateWinPatterns(3, 3),
  '4-3': generateWinPatterns(4, 3),
  '5-4': generateWinPatterns(5, 4),
};

// Classic 3×3 (backward compat)
const WIN_PATTERNS = PATTERN_CACHE['3-3'];

function getWinPatterns(size = 3) {
  const winLen = size === 5 ? 4 : 3;
  const key = `${size}-${winLen}`;
  if (!PATTERN_CACHE[key]) PATTERN_CACHE[key] = generateWinPatterns(size, winLen);
  return PATTERN_CACHE[key];
}

function checkWinner(board, size = 3) {
  const patterns = getWinPatterns(size);
  for (const pattern of patterns) {
    const [a, ...rest] = pattern;
    if (board[a] && rest.every(i => board[i] === board[a])) {
      return { winner: board[a], pattern };
    }
  }
  return null;
}

function isBoardFull(board) {
  return board.every(cell => cell !== null);
}

function getGameStatus(board, size = 3) {
  const result = checkWinner(board, size);
  if (result) return { status: `win-${result.winner}`, winner: result.winner, pattern: result.pattern };
  if (isBoardFull(board)) return { status: 'draw', winner: null, pattern: null };
  return { status: 'playing', winner: null, pattern: null };
}

function createEmptyBoard(size = 3) {
  return Array(size * size).fill(null);
}

function getEmptyCells(board) {
  return board.reduce((acc, cell, idx) => { if (cell === null) acc.push(idx); return acc; }, []);
}

function applyMove(board, index, symbol) {
  const nb = [...board]; nb[index] = symbol; return nb;
}

function isValidMove(board, index) {
  return typeof index === 'number' && index >= 0 && index < board.length && board[index] === null;
}

module.exports = {
  WIN_PATTERNS, generateWinPatterns, getWinPatterns,
  checkWinner, isBoardFull, getGameStatus,
  createEmptyBoard, getEmptyCells, applyMove, isValidMove,
};
