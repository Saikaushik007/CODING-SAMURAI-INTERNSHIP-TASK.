'use strict';
/* ══ boardUI.js ══════════════════════════════════════════════════════════════ */

let _cells = [], _board, _winCont, _size = 3;

function initBoard(size = 3) {
  _size  = size;
  _board = document.getElementById('game-board');
  _winCont = document.getElementById('win-line-container');
  _board.innerHTML = '';
  if (_winCont) _winCont.innerHTML = '';
  _cells = [];

  // Set grid size class
  _board.className = `size-${size}`;
  _board.classList.remove('board-disabled','board-result-over','tension-high','tension-win');

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.id = `cell-${i}`;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Cell ${i + 1}`);

    // Hover preview
    const preview = document.createElement('div');
    preview.className = 'hover-preview';
    cell.appendChild(preview);

    cell.addEventListener('click', () => { if (window.NexusApp) window.NexusApp.handleCellClick(i); });
    _board.appendChild(cell);
    _cells.push(cell);
  }

  updatePreviewSymbol('X');
}

// ── Hover preview symbol ──────────────────────────────────────────────────────
function updatePreviewSymbol(symbol) {
  _cells.forEach(cell => {
    const p = cell.querySelector('.hover-preview');
    if (!p) return;
    if (symbol === 'X') {
      p.innerHTML = `<svg viewBox="0 0 100 100" class="mark-x" style="opacity:0.25"><line x1="18" y1="18" x2="82" y2="82" stroke="var(--player-x)" stroke-width="7" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="0"/><line x1="82" y1="18" x2="20" y2="82" stroke="var(--player-x)" stroke-width="7" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="0"/></svg>`;
    } else {
      p.innerHTML = `<svg viewBox="0 0 100 100" class="mark-o" style="opacity:0.25"><circle cx="50" cy="50" r="34" stroke="var(--player-o)" stroke-width="7" fill="none" stroke-dasharray="220" stroke-dashoffset="0"/></svg>`;
    }
  });
}

// ── Create mark ───────────────────────────────────────────────────────────────
function createMark(cell, symbol, doBurst = true) {
  if (!cell || cell.querySelector('svg.placed')) return;
  let svg;
  if (symbol === 'X') {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.classList.add('mark-x', 'placed');
    const l1 = _line(18,18,82,82), l2 = _line(82,18,20,82);
    svg.appendChild(l1); svg.appendChild(l2);
  } else {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.classList.add('mark-o', 'placed');
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx','50'); c.setAttribute('cy','50'); c.setAttribute('r','34');
    svg.appendChild(c);
  }
  // Remove hover preview
  const p = cell.querySelector('.hover-preview'); if (p) p.remove();
  cell.appendChild(svg);
  cell.classList.add('taken','pop-in');
  setTimeout(() => cell.classList.remove('pop-in'), 400);

  // Ink bleed
  cell.classList.add(symbol === 'X' ? 'ink-bleed-x' : 'ink-bleed-o');
  setTimeout(() => cell.classList.remove('ink-bleed-x','ink-bleed-o'), 450);

  // Burst
  if (doBurst && window.ParticleEngine) {
    const r = cell.getBoundingClientRect();
    window.ParticleEngine.burstAt(r.left+r.width/2, r.top+r.height/2, symbol==='X'?'#ff3366':'#00f5ff', 22);
  }
}

function _line(x1,y1,x2,y2) {
  const l = document.createElementNS('http://www.w3.org/2000/svg','line');
  l.setAttribute('x1',x1); l.setAttribute('y1',y1); l.setAttribute('x2',x2); l.setAttribute('y2',y2);
  return l;
}

// ── Cell temperature (neighboring warmth) ────────────────────────────────────
function updateCellTemperature(board, size) {
  _cells.forEach((cell, idx) => {
    if (board[idx] !== null) { cell.removeAttribute('data-temp'); return; }
    const r = Math.floor(idx / size), c = idx % size;
    let xCount = 0, oCount = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r+dr, nc = c+dc;
      if (nr>=0&&nr<size&&nc>=0&&nc<size) {
        const v = board[nr*size+nc];
        if (v === 'X') xCount++;
        else if (v === 'O') oCount++;
      }
    }
    if (xCount > 0 && oCount > 0) cell.setAttribute('data-temp','contest');
    else if (xCount > 0) cell.setAttribute('data-temp','x-warm');
    else if (oCount > 0) cell.setAttribute('data-temp','o-warm');
    else cell.removeAttribute('data-temp');
  });
}

// ── Win highlighting ──────────────────────────────────────────────────────────
function highlightWinningCells(pattern, winner) {
  clearWinHighlights();
  const cls = winner === 'X' ? 'win-x' : 'win-o';
  pattern.forEach(i => { if (_cells[i]) _cells[i].classList.add('winning-cell', cls); });
  _board.classList.add('board-result-over');
  _drawWinLine(pattern, winner);
  // Screen flash
  const flash = document.getElementById('screen-flash');
  if (flash) { flash.style.background = winner==='X'?'rgba(255,51,102,0.15)':'rgba(0,245,255,0.12)'; flash.classList.add('flash'); setTimeout(()=>flash.classList.remove('flash'),600); }
}

function _drawWinLine(pattern, winner) {
  if (!_winCont) return;
  _winCont.innerHTML = '';
  const fc = _cells[pattern[0]], lc = _cells[pattern[pattern.length-1]];
  const fr = fc.getBoundingClientRect(), lr = lc.getBoundingClientRect();
  const cr = _winCont.getBoundingClientRect();
  const x1 = fr.left+fr.width/2-cr.left, y1 = fr.top+fr.height/2-cr.top;
  const x2 = lr.left+lr.width/2-cr.left, y2 = lr.top+lr.height/2-cr.top;
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  const angle = Math.atan2(dy,dx)*(180/Math.PI);
  const line = document.createElement('div');
  line.className = `win-line ${winner==='X'?'win-x':'win-o'}`;
  line.style.cssText = `width:${len}px;left:${x1}px;top:${y1-2}px;transform:rotate(${angle}deg);transform-origin:0 50%;`;
  _winCont.appendChild(line);
}

// ── Hint highlight ────────────────────────────────────────────────────────────
function showHint(index) {
  _cells.forEach(c => c.classList.remove('hint-cell'));
  if (index !== null && index !== undefined && _cells[index]) {
    _cells[index].classList.add('hint-cell');
    setTimeout(() => { if(_cells[index]) _cells[index].classList.remove('hint-cell'); }, 2000);
  }
}

// ── Tension level ─────────────────────────────────────────────────────────────
function setTension(level) {
  _board.classList.remove('tension-high','tension-win');
  if (level === 'high') _board.classList.add('tension-high');
  else if (level === 'win') _board.classList.add('tension-win');
}

// ── Last moves ────────────────────────────────────────────────────────────────
function highlightLastMoves(pi, ai) {
  _cells.forEach(c => c.classList.remove('last-move-player','last-move-ai'));
  if (pi != null && _cells[pi]) _cells[pi].classList.add('last-move-player');
  if (ai != null && _cells[ai]) _cells[ai].classList.add('last-move-ai');
}

// ── Misc ──────────────────────────────────────────────────────────────────────
function shakeCell(i) { const c=_cells[i]; if(!c)return; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); setTimeout(()=>c.classList.remove('shake'),450); }
function disableBoard() { _board.classList.add('board-disabled'); }
function enableBoard()  { _board.classList.remove('board-disabled'); }
function clearWinLine() { if(_winCont) _winCont.innerHTML=''; _board.classList.remove('board-result-over','tension-high','tension-win'); }
function clearWinHighlights() { _cells.forEach(c=>c.classList.remove('winning-cell','win-x','win-o','last-move-player','last-move-ai','hint-cell')); }
function renderBoard(board) { board.forEach((v,i) => { if(v&&_cells[i]&&!_cells[i].querySelector('svg.placed')) createMark(_cells[i],v,false); }); }

window.BoardUI = {
  initBoard, renderBoard, createMark, updatePreviewSymbol,
  highlightWinningCells, highlightLastMoves, showHint,
  updateCellTemperature, setTension,
  shakeCell, disableBoard, enableBoard,
  clearWinLine, clearWinHighlights,
  getCells: () => _cells,
  getSize: () => _size,
};
