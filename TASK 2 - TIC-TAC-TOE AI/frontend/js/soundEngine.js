'use strict';
/* ══════════════════════════════════════════════
   TriMind AI — soundEngine.js  |  Web Audio API
   ══════════════════════════════════════════════ */

let audioCtx    = null;
let isMuted     = false;
let thinkingOsc = null;
let thinkingGain= null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function makeOsc(type, freq, startTime, duration, gain, freqEnd) {
  if (isMuted) return;
  const ctx  = getCtx();
  const osc  = ctx.createOscillator();
  const gNode= ctx.createGain();

  osc.connect(gNode);
  gNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
  }

  gNode.gain.setValueAtTime(0.001, startTime);
  gNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/* ── Click tick ─────────────────────────────── */
function playClick() {
  if (isMuted) return;
  const ctx = getCtx();
  makeOsc('square', 800, ctx.currentTime, 0.05, 0.08, 400);
}

/* ── Player places mark ─────────────────────── */
function playPlayerMove() {
  if (isMuted) return;
  const ctx = getCtx();
  makeOsc('sine', 440, ctx.currentTime, 0.18, 0.28, 880);
}

/* ── AI places mark ─────────────────────────── */
function playAIMove() {
  if (isMuted) return;
  const ctx = getCtx();
  makeOsc('sawtooth', 660, ctx.currentTime, 0.18, 0.22, 330);
}

/* ── Player wins ─────────────────────────────── */
function playWin() {
  if (isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  [[523, 0], [659, 0.15], [784, 0.30], [1047, 0.50]].forEach(([freq, delay]) => {
    makeOsc('sine', freq, now + delay, 0.35, 0.28);
  });
}

/* ── Player loses ───────────────────────────── */
function playLose() {
  if (isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  [[523, 0], [415, 0.15], [330, 0.30], [220, 0.50]].forEach(([freq, delay]) => {
    makeOsc('sawtooth', freq, now + delay, 0.3, 0.22);
  });
}

/* ── Draw ───────────────────────────────────── */
function playDraw() {
  if (isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  makeOsc('sine', 440, now, 0.45, 0.2, 550);
  makeOsc('sine', 550, now, 0.45, 0.15, 440);
}

/* ── Invalid move ───────────────────────────── */
function playInvalid() {
  if (isMuted) return;
  const ctx = getCtx();
  makeOsc('sawtooth', 200, ctx.currentTime, 0.09, 0.18);
}

/* ── AI thinking tremolo ─────────────────────── */
function playThinking() {
  if (isMuted) return;
  stopThinking();
  const ctx  = getCtx();
  thinkingOsc  = ctx.createOscillator();
  thinkingGain = ctx.createGain();
  const lfo    = ctx.createOscillator();
  const lfoGain= ctx.createGain();

  lfo.frequency.value  = 4;
  lfoGain.gain.value   = 0.04;
  lfo.connect(lfoGain);
  lfoGain.connect(thinkingGain.gain);

  thinkingOsc.type = 'sine';
  thinkingOsc.frequency.value = 220;
  thinkingGain.gain.value     = 0.05;

  thinkingOsc.connect(thinkingGain);
  thinkingGain.connect(ctx.destination);

  lfo.start();
  thinkingOsc.start();
}

function stopThinking() {
  try {
    if (thinkingOsc)  { thinkingOsc.stop();  thinkingOsc.disconnect();  }
    if (thinkingGain) { thinkingGain.disconnect(); }
  } catch(e) {}
  thinkingOsc = thinkingGain = null;
}

/* ── Toggle mute ─────────────────────────────── */
function toggleMute() {
  isMuted = !isMuted;
  stopThinking();
  const btn = document.getElementById('btn-sound-toggle');
  if (btn) btn.textContent = isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
  if (window.NexusUI) window.NexusUI.showToast(isMuted ? 'Sound muted' : 'Sound on', 'info');
}

window.SoundEngine = {
  playClick, playPlayerMove, playAIMove,
  playWin, playLose, playDraw, playInvalid,
  playThinking, stopThinking, toggleMute,
  get isMuted() { return isMuted; }
};
