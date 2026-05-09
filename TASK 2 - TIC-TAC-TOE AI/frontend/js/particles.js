'use strict';
/* ══════════════════════════════════════════════
   NEXUS — particles.js  |  Canvas background
   ══════════════════════════════════════════════ */

const COLORS = ['#ff3366', '#00f5ff', '#bf5fff', '#ffd700', '#39ff14'];

/* ── Background canvas ──────────────────────── */
const bgCanvas  = document.getElementById('canvas-bg');
const bgCtx     = bgCanvas.getContext('2d');

/* ── Burst canvas ───────────────────────────── */
const burstCanvas = document.getElementById('particle-burst-layer');
const burstCtx    = burstCanvas.getContext('2d');

let W = 0, H = 0;
let particles = [];
let burstParticles = [];
let animId = null;

/* ── Particle ───────────────────────────────── */
class Particle {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.x     = Math.random() * W;
    this.y     = initial ? Math.random() * H : (Math.random() < 0.5 ? -5 : H + 5);
    this.vx    = (Math.random() - 0.5) * 0.35;
    this.vy    = (Math.random() - 0.5) * 0.35;
    this.size  = Math.random() * 1.8 + 0.5;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.baseOpacity = Math.random() * 0.4 + 0.1;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.02 + 0.005;
  }
  update(t) {
    this.x += this.vx;
    this.y += this.vy;
    this.opacity = this.baseOpacity * (0.6 + 0.4 * Math.sin(this.phase + t * this.speed));
    if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
      this.reset(false);
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Burst Particle ─────────────────────────── */
class BurstParticle {
  constructor(x, y, color) {
    this.x  = x;
    this.y  = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 3 + 1;
    this.life = 1.0;
    this.decay = Math.random() * 0.06 + 0.04;
    this.gravity = 0.12;
  }
  update() {
    this.x  += this.vx;
    this.y  += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.96;
    this.life -= this.decay;
    this.size  *= 0.97;
  }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Connection Lines ───────────────────────── */
function drawConnections() {
  const maxDist = 90;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        const alpha = (1 - dist / maxDist) * 0.08;
        bgCtx.save();
        bgCtx.globalAlpha = alpha;
        bgCtx.strokeStyle = '#6496ff';
        bgCtx.lineWidth = 0.5;
        bgCtx.beginPath();
        bgCtx.moveTo(particles[i].x, particles[i].y);
        bgCtx.lineTo(particles[j].x, particles[j].y);
        bgCtx.stroke();
        bgCtx.restore();
      }
    }
  }
}

/* ── Nebula blobs ───────────────────────────── */
let nebulaT = 0;
const NEBULAS = [
  { cx: 0.1, cy: 0.2, r: 0.3, color: 'rgba(255,51,102,0.025)' },
  { cx: 0.9, cy: 0.8, r: 0.3, color: 'rgba(0,245,255,0.025)'  },
  { cx: 0.8, cy: 0.1, r: 0.25,color: 'rgba(191,95,255,0.02)'  },
  { cx: 0.2, cy: 0.9, r: 0.25,color: 'rgba(255,215,0,0.015)'  },
];
function drawNebulas() {
  NEBULAS.forEach((n, i) => {
    const ox = Math.sin(nebulaT * 0.0003 + i) * 0.03 * W;
    const oy = Math.cos(nebulaT * 0.0004 + i) * 0.03 * H;
    const grd = bgCtx.createRadialGradient(
      n.cx * W + ox, n.cy * H + oy, 0,
      n.cx * W + ox, n.cy * H + oy, n.r * Math.min(W, H)
    );
    grd.addColorStop(0, n.color);
    grd.addColorStop(1, 'transparent');
    bgCtx.fillStyle = grd;
    bgCtx.fillRect(0, 0, W, H);
  });
}

/* ── Main loop ──────────────────────────────── */
let t = 0;
function loop() {
  animId = requestAnimationFrame(loop);
  t++;
  nebulaT = t;

  bgCtx.clearRect(0, 0, W, H);
  drawNebulas();

  // Update & draw particles
  particles.forEach(p => { p.update(t); p.draw(bgCtx); });
  drawConnections();

  // Burst layer
  burstCtx.clearRect(0, 0, W, H);
  burstParticles = burstParticles.filter(bp => bp.life > 0);
  burstParticles.forEach(bp => { bp.update(); bp.draw(burstCtx); });
}

/* ── Resize ─────────────────────────────────── */
function resize() {
  W = bgCanvas.width  = burstCanvas.width  = window.innerWidth;
  H = bgCanvas.height = burstCanvas.height = window.innerHeight;
}

/* ── Public API ─────────────────────────────── */
function init() {
  resize();
  particles = Array.from({ length: 90 }, () => new Particle());
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function burstAt(x, y, color, count = 22) {
  for (let i = 0; i < count; i++) {
    burstParticles.push(new BurstParticle(x, y, color));
  }
}

window.addEventListener('resize', () => { resize(); });

window.ParticleEngine = { init, burstAt };
