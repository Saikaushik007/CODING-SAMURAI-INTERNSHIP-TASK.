'use strict';
const LABELS = ['Top-Left','Top-Center','Top-Right','Mid-Left','Center','Mid-Right','Bot-Left','Bot-Center','Bot-Right',
                'R2C1','R2C2','R2C3','R2C4','R3C1','R3C2','R3C3','R3C4','R4C1','R4C2','R4C3','R4C4',
                'P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14','P15','P16','P17','P18','P19','P20','P21','P22','P23','P24','P25'];
const THEMES = ['nexus','matrix','inferno','ghost'];
const AI_AVATARS = { easy:'😊', medium:'🤔', hard:'🤖' };

const S = {
  board:[], moveHistory:[], boardHistory:[], replayMoves:[],
  gameStatus:'idle', gameMode:'vs-ai', playerSymbol:'X', aiSymbol:'O',
  firstMover:'player', difficulty:'hard', playerName:'PLAYER', p2Name:'PLAYER 2',
  boardSize:3, currentTurn:'X', isAIThinking:false,
  hintsLeft:3, undosLeft:2, scores:{player:0,ai:0,draws:0},
  gameStartTime:null, moveCount:0, lastTaunt:'', streak:0, themeIdx:0,
  timerDuration:0, timerInterval:null, timerLeft:0,
};

// ── DOM refs ─────────────────────────────────────────────────────────────────
let $status, $dots, $orb, $taunt, $moveCount, $moveMax, $hintsLeft, $undosLeft, $timerWrap, $timerBar, $timerLabel;

document.addEventListener('DOMContentLoaded', () => {
  $status    = document.getElementById('status-text');
  $dots      = document.getElementById('thinking-dots');
  $orb       = document.getElementById('turn-orb');
  $taunt     = document.getElementById('taunt-text');
  $moveCount = document.getElementById('move-count');
  $moveMax   = document.getElementById('move-max');
  $hintsLeft = document.getElementById('hints-left');
  $undosLeft = document.getElementById('undos-left');
  $timerWrap = document.getElementById('timer-bar-wrap');
  $timerBar  = document.getElementById('timer-bar');
  $timerLabel= document.getElementById('timer-label');

  window.ParticleEngine.init();
  window.BoardUI.initBoard(3);
  window.NexusUI.renderAchievements();
  _bindAll();
  _setDiff('hard');
  _setStatus('PRESS NEW GAME TO BEGIN','idle');
  _loadStats();
});

// ── Bind events ───────────────────────────────────────────────────────────────
function _bindAll() {
  // Mode
  document.querySelectorAll('.mode-btn').forEach(b => b.addEventListener('click', () => _setMode(b.dataset.mode)));
  // Difficulty
  document.querySelectorAll('.diff-btn').forEach(b => b.addEventListener('click', () => _setDiff(b.dataset.level)));
  // Board size
  document.querySelectorAll('.size-btn').forEach(b => b.addEventListener('click', () => _setBoardSize(parseInt(b.dataset.size))));
  // Timer
  document.querySelectorAll('.timer-btn').forEach(b => b.addEventListener('click', () => _setTimer(parseInt(b.dataset.timer))));
  // Buttons
  document.getElementById('btn-new-game').addEventListener('click', _openSetup);
  document.getElementById('btn-reset-stats').addEventListener('click', _resetStats);
  document.getElementById('btn-sound-toggle').addEventListener('click', () => window.SoundEngine.toggleMute());
  document.getElementById('btn-theme-toggle').addEventListener('click', _cycleTheme);
  document.getElementById('btn-hint').addEventListener('click', _useHint);
  document.getElementById('btn-undo').addEventListener('click', _undo);
  document.getElementById('btn-replay').addEventListener('click', _replay);
  // Player name
  document.getElementById('player-name-input').addEventListener('input', e => {
    S.playerName = e.target.value.trim().toUpperCase() || 'PLAYER';
    window.NexusUI.updatePlayerName(S.playerName);
  });
  // Coin toss modal
  document.getElementById('pick-x').addEventListener('click', () => _pickSymbol('X'));
  document.getElementById('pick-o').addEventListener('click', () => _pickSymbol('O'));
  document.getElementById('btn-coin-toss').addEventListener('click', _coinToss);
  document.getElementById('first-player').addEventListener('click', () => _setFirst('player'));
  document.getElementById('first-ai').addEventListener('click', () => _setFirst('ai'));
  document.getElementById('btn-launch-game').addEventListener('click', _launchGame);
  // Result modal
  document.getElementById('modal-play-again').addEventListener('click', () => { _hideModal('result-modal'); _openSetup(); });
  document.getElementById('modal-replay').addEventListener('click', () => { _hideModal('result-modal'); _replay(); });
  document.getElementById('modal-menu').addEventListener('click', () => { _hideModal('result-modal'); S.gameStatus='idle'; _setStatus('PRESS NEW GAME TO BEGIN','idle'); });
  // How to play
  document.getElementById('rules-toggle').addEventListener('click', function() {
    const open = this.getAttribute('aria-expanded')==='true';
    this.setAttribute('aria-expanded', String(!open));
    document.getElementById('rules-body').style.display = open?'none':'block';
  });
  // Mobile tabs
  document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => _mobileTab(b.id)));
  // Keyboard
  document.addEventListener('keydown', _onKey);
}

// ── Settings ──────────────────────────────────────────────────────────────────
function _setMode(m) {
  S.gameMode = m;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode===m));
  document.getElementById('difficulty-section').style.opacity = m==='vs-ai'?'1':'0.4';
  window.NexusUI.showToast(m==='vs-ai'?'VS TriMind AI mode':'2 Player mode','info');
}
function _setDiff(d) {
  S.difficulty = d;
  document.querySelectorAll('.diff-btn').forEach(b=>b.classList.toggle('active',b.dataset.level===d));
  document.body.setAttribute('data-difficulty',d);
  document.getElementById('ai-avatar').textContent = AI_AVATARS[d]||'🤖';
  if(S.gameStatus!=='idle') window.NexusUI.showToast('Difficulty: '+d.toUpperCase()+' (next game)','info');
}
function _setBoardSize(n) {
  S.boardSize = n;
  document.querySelectorAll('.size-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.size)===n));
  if($moveMax) $moveMax.textContent = n*n;
}
function _setTimer(t) {
  S.timerDuration = t;
  document.querySelectorAll('.timer-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.timer)===t));
}
function _cycleTheme() {
  S.themeIdx = (S.themeIdx+1)%THEMES.length;
  document.body.setAttribute('data-theme', THEMES[S.themeIdx]);
  window.NexusUI.showToast('Theme: '+THEMES[S.themeIdx].toUpperCase(),'info');
}

// ── Setup / Coin toss modal ───────────────────────────────────────────────────
function _openSetup() {
  _clearTimer();
  document.getElementById('coin-toss-modal').classList.remove('hidden');
  _pickSymbol('X'); _setFirst('player');
}
function _pickSymbol(sym) {
  S.playerSymbol = sym; S.aiSymbol = sym==='X'?'O':'X';
  document.getElementById('pick-x').classList.toggle('active', sym==='X');
  document.getElementById('pick-o').classList.toggle('active', sym==='O');
  document.getElementById('first-mover-section').style.display = S.gameMode==='vs-ai'?'block':'none';
}
function _coinToss() {
  const coin = document.getElementById('coin');
  coin.classList.add('flipping');
  setTimeout(()=>{ coin.classList.remove('flipping'); _pickSymbol(Math.random()<0.5?'X':'O'); }, 950);
}
function _setFirst(who) {
  S.firstMover = who;
  document.getElementById('first-player').classList.toggle('active', who==='player');
  document.getElementById('first-ai').classList.toggle('active', who==='ai');
}
function _launchGame() {
  _hideModal('coin-toss-modal');
  startNewGame();
}

// ── Start game ────────────────────────────────────────────────────────────────
async function startNewGame() {
  _clearTimer();
  const sz = S.boardSize;
  S.board       = Array(sz*sz).fill(null);
  S.moveHistory = []; S.boardHistory = []; S.replayMoves = [];
  S.moveCount   = 0; S.gameStatus = 'playing'; S.isAIThinking = false;
  S.hintsLeft   = 3; S.undosLeft  = 2; S.lastTaunt = '';
  S.gameStartTime = Date.now();
  S.currentTurn = S.firstMover==='ai' ? S.aiSymbol : S.playerSymbol;

  window.BoardUI.initBoard(sz);
  window.BoardUI.updatePreviewSymbol(S.playerSymbol);
  window.NexusUI.renderMoveHistory([]);
  if($moveCount) $moveCount.textContent='0';
  if($moveMax)   $moveMax.textContent  = sz*sz;
  if($hintsLeft) $hintsLeft.textContent= 3;
  if($undosLeft) $undosLeft.textContent= 2;
  document.getElementById('btn-undo').disabled  = true;
  document.getElementById('btn-hint').disabled  = false;
  document.getElementById('btn-replay').style.display = 'none';

  const res = await window.NexusAPI.newGame(S.difficulty, S.playerName, sz);
  _displayTaunt((res&&res.taunt)||'TriMind AI online. Let the battle begin! 🤖');

  if(S.gameMode==='vs-ai' && S.firstMover==='ai') {
    _setStatus('TRIMIND CALCULATING...','ai');
    if($dots) $dots.classList.remove('hidden');
    window.SoundEngine.playThinking();
    const r2 = await window.NexusAPI.aiFirst(S.board, S.difficulty, S.aiSymbol, S.playerSymbol, sz);
    await _wait(r2&&r2.thinkingTime?r2.thinkingTime:800);
    window.SoundEngine.stopThinking();
    if($dots) $dots.classList.add('hidden');
    if(r2&&!r2.error&&r2.aiMove!=null) {
      S.board = r2.board;
      const cells = window.BoardUI.getCells();
      window.BoardUI.createMark(cells[r2.aiMove], S.aiSymbol, true);
      window.SoundEngine.playAIMove();
      _addMove(r2.aiMove, S.aiSymbol);
      S.currentTurn = S.playerSymbol;
    }
  }
  _setStatus('Your move, '+S.playerName,'player');
  _startTimer();
}

// ── Cell click ────────────────────────────────────────────────────────────────
async function handleCellClick(idx) {
  if(S.gameStatus!=='playing') return;
  if(S.board[idx]!==null){ window.BoardUI.shakeCell(idx); window.SoundEngine.playInvalid(); return; }
  if(S.isAIThinking) return;

  // Two-player mode
  if(S.gameMode==='vs-human') {
    _applyPlayerMove(idx, S.currentTurn);
    // Check result
    const fake = {board:S.board, aiMove:null, gameStatus:_localStatus(), winPattern:_localPattern(), taunt:'', thinkingTime:0};
    _processResult(fake, idx, null);
    if(S.gameStatus==='playing'){
      S.currentTurn = S.currentTurn==='X'?'O':'X';
      const who = S.currentTurn===S.playerSymbol?S.playerName:S.p2Name;
      _setStatus(who+"'s turn", S.currentTurn===S.playerSymbol?'player':'ai');
    }
    return;
  }

  // vs AI
  S.isAIThinking = true;
  window.BoardUI.disableBoard();
  _clearTimer();

  const pre = [...S.board]; // snapshot BEFORE move
  S.boardHistory.push({board:pre, moveHistory:[...S.moveHistory], moveCount:S.moveCount});

  _applyPlayerMove(idx, S.playerSymbol);

  _setStatus('TRIMIND CALCULATING...','ai');
  if($dots) $dots.classList.remove('hidden');
  window.SoundEngine.playThinking();

  const res = await window.NexusAPI.makeMove(pre, idx, S.difficulty, S.playerSymbol, S.boardSize);
  await _wait(res&&res.thinkingTime?res.thinkingTime:800);
  window.SoundEngine.stopThinking();
  if($dots) $dots.classList.add('hidden');

  if(!res||res.error){ window.NexusUI.showToast('Server error — is backend running?','error'); S.isAIThinking=false; window.BoardUI.enableBoard(); _startTimer(); return; }

  S.board = res.board;
  const cells = window.BoardUI.getCells();
  if(res.aiMove!=null){ window.BoardUI.createMark(cells[res.aiMove],S.aiSymbol,true); window.SoundEngine.playAIMove(); _addMove(res.aiMove,S.aiSymbol); }
  window.BoardUI.highlightLastMoves(idx, res.aiMove);
  window.BoardUI.updateCellTemperature(S.board, S.boardSize);
  _displayTaunt(res.taunt||'');
  // Tension
  if(res.gameStatus==='playing') window.BoardUI.setTension(_boardTension());

  document.getElementById('btn-undo').disabled = S.boardHistory.length===0;
  S.isAIThinking = false;
  _processResult(res, idx, res.aiMove);
}

function _applyPlayerMove(idx, sym) {
  S.board[idx] = sym;
  const cells = window.BoardUI.getCells();
  window.BoardUI.createMark(cells[idx], sym, true);
  window.SoundEngine.playPlayerMove();
  _addMove(idx, sym);
  window.BoardUI.updateCellTemperature(S.board, S.boardSize);
  document.getElementById('btn-undo').disabled = false;
}

function _processResult(res, playerIdx, aiIdx) {
  if(res.gameStatus==='playing'){
    window.BoardUI.enableBoard();
    _setStatus('Your move, '+S.playerName,'player');
    _startTimer();
  } else {
    _handleGameOver(res.gameStatus, res.winPattern||null);
  }
}

// ── Local status check (2-player) ─────────────────────────────────────────────
function _localStatus() {
  const sz = S.boardSize, winLen = sz===5?4:3;
  // Check win
  for(const p of _genPatterns(sz,winLen)){
    const [a,...rest]=p; if(S.board[a]&&rest.every(i=>S.board[i]===S.board[a])) return 'win-'+S.board[a];
  }
  if(S.board.every(c=>c!==null)) return 'draw';
  return 'playing';
}
function _localPattern() {
  const sz=S.boardSize, winLen=sz===5?4:3;
  for(const p of _genPatterns(sz,winLen)){
    const [a,...rest]=p; if(S.board[a]&&rest.every(i=>S.board[i]===S.board[a])) return p;
  }
  return null;
}
function _genPatterns(sz,wl) {
  const ps=[];
  for(let r=0;r<sz;r++)for(let c=0;c<=sz-wl;c++)ps.push(Array.from({length:wl},(_,i)=>r*sz+c+i));
  for(let c=0;c<sz;c++)for(let r=0;r<=sz-wl;r++)ps.push(Array.from({length:wl},(_,i)=>(r+i)*sz+c));
  for(let r=0;r<=sz-wl;r++)for(let c=0;c<=sz-wl;c++)ps.push(Array.from({length:wl},(_,i)=>(r+i)*sz+(c+i)));
  for(let r=0;r<=sz-wl;r++)for(let c=wl-1;c<sz;c++)ps.push(Array.from({length:wl},(_,i)=>(r+i)*sz+(c-i)));
  return ps;
}

// ── Board tension heuristic ───────────────────────────────────────────────────
function _boardTension() {
  const filled = S.board.filter(Boolean).length;
  const total  = S.boardSize*S.boardSize;
  return filled/total > 0.55 ? 'high' : 'normal';
}

// ── Game Over ─────────────────────────────────────────────────────────────────
async function _handleGameOver(status, pattern) {
  S.gameStatus = 'over';
  _clearTimer();
  window.BoardUI.disableBoard();
  window.BoardUI.setTension('win');
  document.getElementById('btn-replay').style.display = 'block';

  let result='draw';
  if(status==='win-X'||status==='win-O'){
    const winner=status.slice(4);
    window.BoardUI.highlightWinningCells(pattern, winner);
    if(winner===S.playerSymbol){ window.SoundEngine.playWin(); S.scores.player++; result='player'; S.streak++; _setStatus('⚡ VICTORY! ⚡','player'); }
    else { window.SoundEngine.playLose(); S.scores.ai++; result='ai'; S.streak=0; _setStatus('TRIMIND WINS','ai'); }
  } else {
    window.SoundEngine.playDraw(); S.scores.draws++; S.streak=0; _setStatus('DRAW — WELL PLAYED','idle');
  }

  window.NexusUI.updateScoreBoard(S.scores.player, S.scores.ai, S.scores.draws);
  window.NexusUI.updateStreak(S.streak);
  const duration = Math.floor((Date.now()-S.gameStartTime)/1000);
  await window.NexusAPI.recordResult(result, duration, S.moveCount, S.difficulty);
  const stats = await window.NexusAPI.getStats();
  window.NexusUI.renderStats(stats);

  // Achievements
  const un = window.NexusUI.unlockAchievement.bind(window.NexusUI);
  if(result==='player') un('first_blood');
  if(result==='player'&&duration<10) un('speedrun');
  if(result==='player'&&S.difficulty==='hard') un('big_brain');
  if(S.streak>=3) un('on_fire');
  if(result==='draw'&&S.difficulty==='hard') un('iron_wall');
  if(result==='player'&&S.moveCount<=5) un('perfectionist');

  window.NexusUI.showAnalysis(S.moveHistory, result, S.difficulty);
  setTimeout(()=>_showModal(status,duration), 1500);
}

// ── Result Modal ──────────────────────────────────────────────────────────────
function _showModal(status, duration) {
  const m=document.getElementById('result-modal');
  const card=m.querySelector('.modal-card');
  card.style.animation='none'; void card.offsetWidth; card.style.animation='';
  const t=document.getElementById('modal-title'), ic=document.getElementById('modal-icon');
  const ring=document.getElementById('modal-glow-ring');
  if(status==='win-X'||status==='win-O'){
    const winner=status.slice(4);
    if(winner===S.playerSymbol){ t.textContent='VICTORY!'; t.className='modal-title victory'; ic.textContent='🏆'; ring.className='modal-glow-ring victory'; }
    else { t.textContent='DEFEAT'; t.className='modal-title defeat'; ic.textContent='🤖'; ring.className='modal-glow-ring defeat'; }
  } else { t.textContent='DRAW'; t.className='modal-title draw'; ic.textContent='⚖️'; ring.className='modal-glow-ring draw'; }
  document.getElementById('modal-taunt').textContent = S.lastTaunt;
  document.getElementById('modal-duration').textContent = duration+'s';
  document.getElementById('modal-moves').textContent   = S.moveCount;
  document.getElementById('modal-difficulty').textContent = S.gameMode==='vs-human'?'2P':S.difficulty.toUpperCase();
  m.classList.remove('hidden');
}
function _hideModal(id){ document.getElementById(id).classList.add('hidden'); }

// ── Hint ──────────────────────────────────────────────────────────────────────
async function _useHint() {
  if(S.gameStatus!=='playing'||S.isAIThinking||S.hintsLeft<=0) return;
  S.hintsLeft--;
  if($hintsLeft) $hintsLeft.textContent=S.hintsLeft;
  if(S.hintsLeft===0) document.getElementById('btn-hint').disabled=true;
  const res = await window.NexusAPI.getHint(S.board, S.playerSymbol, S.boardSize);
  if(res&&!res.error&&res.hintMove!=null){ window.BoardUI.showHint(res.hintMove); window.NexusUI.showToast('💡 Best move highlighted!','info'); }
}

// ── Undo ──────────────────────────────────────────────────────────────────────
function _undo() {
  if(S.gameStatus!=='playing'||S.boardHistory.length===0||S.undosLeft<=0) return;
  S.undosLeft--;
  if($undosLeft) $undosLeft.textContent=S.undosLeft;
  if(S.undosLeft===0) document.getElementById('btn-undo').disabled=true;
  const snap = S.boardHistory.pop();
  S.board = snap.board; S.moveHistory = snap.moveHistory; S.moveCount = snap.moveCount;
  window.BoardUI.initBoard(S.boardSize);
  window.BoardUI.updatePreviewSymbol(S.playerSymbol);
  window.BoardUI.renderBoard(S.board);
  window.BoardUI.updateCellTemperature(S.board, S.boardSize);
  window.NexusUI.renderMoveHistory(S.moveHistory);
  if($moveCount) $moveCount.textContent=S.moveCount;
  _displayTaunt('Running away from your mistake? Bold. 😏');
  window.NexusUI.showToast('Move undone','warning');
}

// ── Replay ────────────────────────────────────────────────────────────────────
async function _replay() {
  if(S.replayMoves.length===0&&S.moveHistory.length===0) return;
  const moves = S.replayMoves.length?S.replayMoves:[...S.moveHistory];
  window.BoardUI.initBoard(S.boardSize);
  _setStatus('REPLAY MODE','idle');
  for(const m of moves){
    const cells=window.BoardUI.getCells();
    window.BoardUI.createMark(cells[m.index], m.symbol, false);
    await _wait(600);
  }
  _setStatus('REPLAY DONE','idle');
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function _startTimer() {
  if(!S.timerDuration||S.gameMode==='vs-human') return;
  _clearTimer();
  S.timerLeft = S.timerDuration;
  if($timerWrap) $timerWrap.classList.remove('hidden');
  _updateTimerUI();
  S.timerInterval = setInterval(()=>{
    S.timerLeft--;
    _updateTimerUI();
    if(S.timerLeft<=3&&$timerBar) $timerBar.classList.add('danger');
    if(S.timerLeft<=0){ _clearTimer(); _autoMove(); }
  },1000);
}
function _clearTimer(){
  clearInterval(S.timerInterval); S.timerInterval=null;
  if($timerWrap) $timerWrap.classList.add('hidden');
  if($timerBar)  $timerBar.classList.remove('danger');
}
function _updateTimerUI(){
  const pct=((S.timerLeft/S.timerDuration)*100).toFixed(1)+'%';
  if($timerBar) $timerBar.style.setProperty('--timer-pct',pct);
  if($timerLabel) $timerLabel.textContent=S.timerLeft;
}
function _autoMove(){
  const empty=S.board.map((v,i)=>v===null?i:-1).filter(i=>i>=0);
  if(empty.length) handleCellClick(empty[Math.floor(Math.random()*empty.length)]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _addMove(idx, sym) {
  S.moveCount++;
  const entry={turn:S.moveCount,symbol:sym,index:idx,pos:LABELS[idx]||`Cell${idx}`,isPlayer:sym===S.playerSymbol};
  S.moveHistory.push(entry); S.replayMoves.push(entry);
  window.NexusUI.renderMoveHistory(S.moveHistory);
  if($moveCount) $moveCount.textContent=S.moveCount;
}
function _setStatus(txt, who){
  if($status){ $status.textContent=txt; $status.className='status-text'; if(who==='player') $status.classList.add('player-turn'); else if(who==='ai') $status.classList.add('ai-turn'); }
  if($orb){ $orb.className='turn-indicator'; if(who==='ai') $orb.classList.add('ai-turn'); }
}
function _displayTaunt(txt){
  if(!txt||txt===S.lastTaunt) return;
  S.lastTaunt=txt; if(!$taunt) return;
  $taunt.style.opacity='0'; $taunt.style.transform='translateY(8px)';
  setTimeout(()=>{ $taunt.textContent=txt; $taunt.style.transition='opacity .3s,transform .3s'; $taunt.style.opacity='1'; $taunt.style.transform='translateY(0)'; },200);
}
async function _loadStats(){ const s=await window.NexusAPI.getStats(); window.NexusUI.renderStats(s); }
async function _resetStats(){
  if(!confirm('Reset all stats?')) return;
  await window.NexusAPI.resetStats();
  S.scores={player:0,ai:0,draws:0}; S.streak=0;
  window.NexusUI.updateScoreBoard(0,0,0); window.NexusUI.updateStreak(0);
  _loadStats(); window.NexusUI.showToast('Stats reset','warning');
}
function _mobileTab(id){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.id===id));
  document.getElementById('left-panel').classList.remove('mobile-visible');
  document.getElementById('right-panel').classList.remove('mobile-visible');
  if(id==='tab-stats')   document.getElementById('right-panel').classList.add('mobile-visible');
  if(id==='tab-history') document.getElementById('left-panel').classList.add('mobile-visible');
}
function _wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

// ── Keyboard shortcuts ─────────────────────────────────────────────────────────
function _onKey(e) {
  if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  const k=e.key.toUpperCase();
  if(k==='ESCAPE'){ document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m=>m.classList.add('hidden')); return; }
  if(k==='N'){ _openSetup(); return; }
  if(k==='H'){ _useHint(); return; }
  if(k==='U'){ _undo(); return; }
  if(k==='S'){ window.SoundEngine.toggleMute(); return; }
  if(k==='T'){ _cycleTheme(); return; }
  // 1-9 → cells
  const n=parseInt(k,10);
  if(n>=1&&n<=9){ handleCellClick(n-1); return; }
}

window.NexusApp = { handleCellClick, startNewGame, isPlaying:()=>S.gameStatus==='playing' };
