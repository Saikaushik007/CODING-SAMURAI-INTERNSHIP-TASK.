'use strict';

// In-memory stats store — resets on server restart
const store = {
  totalGames: 0,
  playerWins: 0,
  aiWins: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
  history: [],        // Array of { result, difficulty, duration, moveCount, timestamp }
  streakType: null,   // 'player' | 'ai' | 'draw'
};

/**
 * recordGame(result, difficulty, duration, moveCount)
 * Updates the in-memory stats store and returns an updated copy
 */
function recordGame(result, difficulty, duration, moveCount) {
  store.totalGames++;

  // Increment result counter
  if (result === 'player') store.playerWins++;
  else if (result === 'ai') store.aiWins++;
  else store.draws++;

  // Update streak
  if (result === store.streakType) {
    store.currentStreak++;
  } else {
    store.streakType = result;
    store.currentStreak = 1;
  }

  // Update best streak
  if (store.currentStreak > store.bestStreak) {
    store.bestStreak = store.currentStreak;
  }

  // Push to history (keep last 50)
  store.history.push({
    result,
    difficulty,
    duration,
    moveCount,
    timestamp: new Date().toISOString(),
  });
  if (store.history.length > 50) store.history.shift();

  return getStats();
}

/**
 * getStats()
 * Returns a copy of the current stats store with calculated winRate
 */
function getStats() {
  const winRate =
    store.totalGames > 0
      ? Math.round((store.playerWins / store.totalGames) * 100)
      : 0;
  return {
    totalGames: store.totalGames,
    playerWins: store.playerWins,
    aiWins: store.aiWins,
    draws: store.draws,
    winRate,
    currentStreak: store.currentStreak,
    bestStreak: store.bestStreak,
    history: [...store.history],
    streakType: store.streakType,
  };
}

/**
 * resetStats()
 * Resets store to defaults
 */
function resetStats() {
  store.totalGames = 0;
  store.playerWins = 0;
  store.aiWins = 0;
  store.draws = 0;
  store.currentStreak = 0;
  store.bestStreak = 0;
  store.history = [];
  store.streakType = null;
}

module.exports = { recordGame, getStats, resetStats };
