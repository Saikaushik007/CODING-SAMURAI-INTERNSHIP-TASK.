'use strict';

const PERSONALITY = {
  gameStart: [
    "Initializing TriMind AI core... Prepare to be outmaneuvered. 🧠",
    "Another challenger? Interesting. Let us begin. ⚡",
    "TriMind AI online. Your defeat is already calculated. 🔮",
    "Welcome to the arena. I have never lost. Today won't be different. 💀",
  ],
  strategicMove: [
    "Center secured. The board belongs to me now. 😏",
    "I've already seen 12 moves ahead. Have you? 🧠",
    "Every move I make is optimal. Can you say the same? ⚡",
    "Calculated. Precise. Inevitable. 🎯",
  ],
  blocking: [
    "Did you think I wouldn't see that? Cute. 😄",
    "BLOCK executed. Your plan has been neutralized. 🛡️",
    "I see all possible futures. That path is closed. 🔮",
    "Interesting strategy. Ineffective, but interesting. 🧠",
  ],
  aboutToWin: [
    "Oh? I see my victory condition forming... 👁️",
    "One more move. This was inevitable. ⚡",
    "TriMind AI win protocol initiated. 🎯",
    "You may want to look... there. Not that it helps. 😈",
  ],
  aiWins: [
    "TriMind AI WINS. As calculated. Better luck next time, human. 🏆",
    "Victory achieved. My algorithms remain undefeated. ⚡",
    "Did that hurt? Don't worry — most humans lose to me. 🧠",
    "GG. No re? Actually, please re — I enjoy this. 😏",
  ],
  humanWins: [
    "...Interesting. You found a gap in my defenses. 🧐",
    "Well played. I'll recalibrate. Enjoy this — it won't happen again. 👏",
    "My algorithm must have underestimated you. Error logged. 📝",
    "A victory for humanity! (On easy mode, but still.) 🎉",
  ],
  draw: [
    "A draw. You were worthy enough to survive, at least. 🤝",
    "Stalemate. I respect your... persistence. 🙏",
    "No winner today. Acceptable. Barely. ⚖️",
    "You avoided defeat. That itself is an achievement. 🛡️",
  ],
  humanTookCenter: [
    "The center? Wise. You know what you're doing. Stay alert. 👁️",
    "Smart opening. But I've already adapted. 🧠",
  ],
  thinking: [
    "Analyzing 255,168 possible games... ♟️",
    "Running Minimax... depth 9... pruning... ✂️",
    "Computing optimal response... 🔄",
    "Scanning all futures... 🔮",
  ],
};

function getRandomTaunt(category) {
  const list = PERSONALITY[category] || PERSONALITY.strategicMove;
  return list[Math.floor(Math.random() * list.length)];
}

function getContextualTaunt(board, lastAIMove, gameStatus, difficulty) {
  if (gameStatus === 'win-O') return getRandomTaunt('aiWins');
  if (gameStatus === 'win-X') return getRandomTaunt('humanWins');
  if (gameStatus === 'draw') return getRandomTaunt('draw');
  if (lastAIMove === null || lastAIMove === undefined) return getRandomTaunt('gameStart');

  const WIN_PATTERNS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  let wasBlocking = false;
  let aiAboutToWin = false;

  for (const [a, b, c] of WIN_PATTERNS) {
    const cells = [board[a], board[b], board[c]];
    const xCount = cells.filter(v => v === 'X').length;
    const oCount = cells.filter(v => v === 'O').length;
    const nullCount = cells.filter(v => v === null).length;

    if (xCount === 2 && nullCount === 0 && oCount === 1) wasBlocking = true;
    if (oCount === 2 && nullCount === 1) aiAboutToWin = true;
  }

  if (wasBlocking) return getRandomTaunt('blocking');
  if (aiAboutToWin) return getRandomTaunt('aboutToWin');

  const strategicCells = [0, 2, 4, 6, 8];
  if (strategicCells.includes(lastAIMove)) return getRandomTaunt('strategicMove');

  return getRandomTaunt('strategicMove');
}

module.exports = { getContextualTaunt, getRandomTaunt, PERSONALITY };
