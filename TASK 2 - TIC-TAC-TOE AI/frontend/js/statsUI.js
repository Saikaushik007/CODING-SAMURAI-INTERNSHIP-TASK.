'use strict';
/* ══ statsUI.js ══════════════════════════════════════════════════════════════
   Rank, achievements, win-rate bar, history dots, move log, stats graph, toasts
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Rank tiers ───────────────────────────────────────────────────────────────
const RANKS = [
  { min:0,  max:20,  name:'NOVICE',       icon:'🔰' },
  { min:21, max:40,  name:'APPRENTICE',   icon:'⚔️'  },
  { min:41, max:60,  name:'STRATEGIST',   icon:'🎯'  },
  { min:61, max:80,  name:'GRANDMASTER',  icon:'👑'  },
  { min:81, max:100, name:'TRIMIND SLAYER', icon:'💀'  },
];

// ── All achievement definitions ───────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first_blood', icon:'🏅', name:'First Blood',    desc:'Win your first game' },
  { id:'speedrun',    icon:'⚡', name:'Speedrun',       desc:'Win in under 10 seconds' },
  { id:'big_brain',   icon:'🧠', name:'Big Brain',      desc:'Beat AI on Hard mode' },
  { id:'on_fire',     icon:'🔥', name:'On Fire',        desc:'Win 3 games in a row' },
  { id:'iron_wall',   icon:'🛡️', name:'Iron Wall',      desc:'Draw against Hard AI' },
  { id:'ghost',       icon:'👻', name:'Ghost',          desc:'Win without AI getting 2-in-a-row' },
  { id:'comeback',    icon:'🌟', name:'Comeback',       desc:'Win after losing 3 in a row' },
  { id:'perfectionist',icon:'✨','name':'Perfectionist', desc:'Win using only 5 moves' },
];

function _getUnlocked() {
  try { return JSON.parse(localStorage.getItem('trimind_achievements') || '[]'); }
  catch { return []; }
}
function _saveUnlocked(arr) {
  try { localStorage.setItem('trimind_achievements', JSON.stringify(arr)); } catch {}
}

function renderAchievements() {
  const grid    = document.getElementById('achievements-grid');
  if (!grid) return;
  const unlocked = _getUnlocked();
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const el = document.createElement('div');
    el.className = 'ach-badge ' + (unlocked.includes(a.id) ? 'unlocked' : 'locked');
    el.textContent = a.icon;
    el.title = `${a.name} — ${a.desc}${unlocked.includes(a.id) ? ' ✓' : ''}`;
    grid.appendChild(el);
  });
}

function unlockAchievement(id) {
  const unlocked = _getUnlocked();
  if (unlocked.includes(id)) return false;
  unlocked.push(id);
  _saveUnlocked(unlocked);
  const def = ACHIEVEMENTS.find(a => a.id === id);
  if (def) _showAchievementPopup(def);
  renderAchievements();
  return true;
}

function _showAchievementPopup(def) {
  const popup = document.getElementById('achievement-popup');
  const icon  = document.getElementById('ach-icon');
  const name  = document.getElementById('ach-name');
  if (!popup) return;
  icon.textContent = def.icon;
  name.textContent = def.name;
  popup.classList.remove('hidden');
  popup.style.animation = 'none';
  void popup.offsetWidth;
  popup.style.animation = 'achUnlock 3.5s ease forwards';
  setTimeout(() => popup.classList.add('hidden'), 3600);
}

// ── Rank ─────────────────────────────────────────────────────────────────────
function updateRank(winRate) {
  const tier = RANKS.find(r => winRate >= r.min && winRate <= r.max) || RANKS[0];
  const icon = document.getElementById('rank-icon');
  const name = document.getElementById('rank-name');
  if (icon) { icon.textContent = tier.icon; icon.style.animation = 'rankUp 0.5s ease'; setTimeout(() => { icon.style.animation = ''; }, 600); }
  if (name) name.textContent = tier.name;
}

// ── Win-rate bar ──────────────────────────────────────────────────────────────
function animateWinRateBar(winRate) {
  const fill = document.getElementById('win-rate-fill');
  const pct  = document.getElementById('win-rate-pct');
  const rate = Math.max(0, Math.min(100, winRate || 0));
  if (fill) fill.style.width = rate.toFixed(1) + '%';
  if (pct)  pct.textContent  = Math.round(rate) + '%';
  updateRank(rate);
}

// ── Full stats render ─────────────────────────────────────────────────────────
function renderStats(stats) {
  if (!stats || stats.error) return;
  const s = id => { const el = document.getElementById(id); return el; };
  const set = (id, v) => { const el = s(id); if (el) el.textContent = v; };

  set('total-games', stats.totalGames || 0);
  set('best-streak', stats.bestStreak || 0);
  set('hard-wins',   stats.hardWins   || 0);

  // Avg moves
  const h = stats.history || [];
  if (h.length > 0) {
    const avg = (h.reduce((a, g) => a + (g.moveCount || 0), 0) / h.length).toFixed(1);
    set('avg-moves', avg);
  }

  const wr = stats.totalGames > 0 ? (stats.playerWins / stats.totalGames) * 100 : 0;
  animateWinRateBar(wr);
  renderHistory(stats.history || []);
  drawStatsGraph(stats.history || []);
}

// ── History dots ──────────────────────────────────────────────────────────────
function renderHistory(history) {
  const c = document.getElementById('game-history');
  if (!c) return;
  c.innerHTML = '';
  const last8 = history.slice(-8);
  last8.forEach((e, i) => {
    const dot = document.createElement('div');
    dot.className = 'history-dot ' + (e.result === 'player' ? 'player-win' : e.result === 'ai' ? 'ai-win' : 'draw');
    const n = history.length - last8.length + i + 1;
    const r = e.result === 'player' ? 'YOU WON' : e.result === 'ai' ? 'TRIMIND WON' : 'DRAW';
    dot.title = `Game ${n} — ${r} (${(e.difficulty||'hard').toUpperCase()}, ${e.moveCount||'?'} moves)`;
    c.appendChild(dot);
  });
}

// ── Move log ──────────────────────────────────────────────────────────────────
function renderMoveHistory(moves) {
  const list = document.getElementById('move-history');
  if (!list) return;
  list.innerHTML = '';
  moves.forEach(m => {
    const el = document.createElement('div');
    el.className = `move-item ${m.symbol === 'X' ? 'player-move' : 'ai-move'}`;
    el.innerHTML = `<span class="move-num">#${m.turn}</span><span class="move-sym">${m.symbol}</span><span class="move-pos">${m.pos}</span>`;
    list.appendChild(el);
  });
  list.scrollTop = list.scrollHeight;
}

// ── Scoreboard ────────────────────────────────────────────────────────────────
function updateScoreBoard(playerWins, aiWins, draws) {
  _upd('score-player', playerWins);
  _upd('score-ai',     aiWins);
  _upd('score-draws',  draws);
}
function _upd(id, v) {
  const el = document.getElementById(id);
  if (!el) return;
  const old = parseInt(el.textContent, 10);
  el.textContent = v;
  if (v !== old) {
    el.classList.remove('score-bump'); void el.offsetWidth;
    el.classList.add('score-bump');
    setTimeout(() => el.classList.remove('score-bump'), 450);
  }
}

// ── Stats graph (Canvas) ──────────────────────────────────────────────────────
function drawStatsGraph(history) {
  const canvas = document.getElementById('stats-graph');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const last20 = history.slice(-20);
  if (last20.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '11px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No games yet', W/2, H/2);
    return;
  }

  const barW = Math.floor((W - 8) / Math.max(last20.length, 1)) - 2;
  last20.forEach((g, i) => {
    const x = 4 + i * (barW + 2);
    const color = g.result === 'player' ? '#ff3366' : g.result === 'ai' ? '#00f5ff' : '#ffd700';
    ctx.fillStyle = color + '30';
    ctx.fillRect(x, 4, barW, H - 8);
    const filled = g.result === 'player' ? H - 8 : g.result === 'draw' ? (H-8)*0.5 : 10;
    ctx.fillStyle = color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.fillRect(x, H - 4 - filled, barW, filled);
    ctx.shadowBlur = 0;
  });
}

// ── Streak display ────────────────────────────────────────────────────────────
function updateStreak(streak) {
  const display = document.getElementById('streak-display');
  const count   = document.getElementById('streak-count');
  if (!display || !count) return;
  if (streak >= 2) {
    display.style.display = 'flex';
    count.textContent = streak;
    count.style.animation = 'none'; void count.offsetWidth;
    count.style.animation = 'scoreBump 0.4s ease';
  } else {
    display.style.display = 'none';
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 350); }, 3000);
}

// ── Player name display ───────────────────────────────────────────────────────
function updatePlayerName(name) {
  const el = document.getElementById('score-player-name');
  if (el) el.textContent = name || 'PLAYER';
}

// ── Post-game analysis ────────────────────────────────────────────────────────
function showAnalysis(moves, result, difficulty) {
  const box = document.getElementById('post-game-analysis');
  if (!box) return;
  const total = moves.length;
  const playerMoves = moves.filter(m => m.symbol === 'X' || m.isPlayer).length;
  let rating = result === 'player' ? (difficulty === 'hard' ? 'TACTICAL GENIUS' : 'WELL PLAYED') : result === 'draw' ? 'SOLID DEFENSE' : 'NEEDS IMPROVEMENT';
  if (result === 'player' && total <= 5) rating = 'SPEED DEMON';
  box.innerHTML = `
    <div style="font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:1.5px;color:var(--accent-gold);margin-bottom:6px;">POST-GAME ANALYSIS</div>
    <div>🎮 Total moves: <strong>${total}</strong> &nbsp;|&nbsp; Your moves: <strong>${playerMoves}</strong></div>
    <div>📊 TriMind AI rating: <strong style="color:var(--ui-accent)">${rating}</strong></div>
    <div>⚡ Difficulty: <strong>${difficulty.toUpperCase()}</strong></div>
  `;
  box.classList.add('visible');
}

window.NexusUI = {
  renderStats, renderHistory, renderMoveHistory,
  updateScoreBoard, updateStreak, showToast,
  updatePlayerName, unlockAchievement, renderAchievements,
  showAnalysis, drawStatsGraph,
};
