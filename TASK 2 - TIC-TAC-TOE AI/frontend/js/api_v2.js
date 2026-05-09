'use strict';
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

console.log('[NEXUS] API Base:', API_BASE);

async function _req(method, path, body) {
  try {
    const opts = { method, credentials: 'include', headers: {} };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    
    const url = API_BASE + path;
    const res = await fetch(url, opts);
    
    if (!res.ok) { 
      const t = await res.text(); 
      console.error(`[API ERROR] ${method} ${url} -> ${res.status}`, t);
      throw new Error(`HTTP ${res.status}: ${t}`); 
    }
    return await res.json();
  } catch (e) { 
    console.error(`[API FATAL] ${method} ${path}:`, e.message); 
    return { error: true, message: e.message }; 
  }
}
const post   = (p, b) => _req('POST',   p, b);
const get    = (p)    => _req('GET',    p);
const del    = (p)    => _req('DELETE', p);

window.NexusAPI = {
  newGame:      (difficulty, playerName, boardSize) => post('/game/new',      { difficulty, playerName, boardSize }),
  makeMove:     (board, playerMove, difficulty, playerSymbol, boardSize) => post('/game/move', { board, playerMove, difficulty, playerSymbol, boardSize }),
  aiFirst:      (board, difficulty, aiSymbol, playerSymbol, boardSize)  => post('/game/ai-first', { board, difficulty, aiSymbol, playerSymbol, boardSize }),
  getHint:      (board, playerSymbol, boardSize) => post('/game/hint', { board, playerSymbol, boardSize }),
  getGameState: () => get('/game/state'),
  getStats:     () => get('/stats'),
  recordResult: (result, duration, moveCount, difficulty) => post('/stats/record', { result, duration, moveCount, difficulty }),
  resetStats:   () => del('/stats/reset'),
};
