/**
 * @file components/HeroParticles.js
 * @description Partículas temáticas da hero (Xé Preço): bolhas, moedas Kz,
 * etiquetas de preço, carrinhos, %, códigos de barra e setas de descida de
 * preço. Nascem ao fundo (pequenas e ténues), fluem com deriva orgânica e
 * "vêm à frente" ao longo da vida. Canvas leve, pausa quando sai do DOM e
 * respeita prefers-reduced-motion.
 */

const SHAPES = ['bubble', 'bubble', 'bubble', 'coin', 'tag', 'cart', 'percent', 'barcode', 'trend'];
const TAU = Math.PI * 2;
const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

class HeroParticles {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this.rafId = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._resize = this.resize.bind(this);
    this._loop = this.loop.bind(this);

    this.resize();
    this.spawnInitial();
    window.addEventListener('resize', this._resize);

    if (this.reducedMotion) {
      this.drawFrame(performance.now());
    } else {
      this.start();
    }
  }

  destroy() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this._resize);
    this.particles = [];
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.w = w;
    this.h = h;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  targetCount() {
    return Math.max(8, Math.min(22, Math.round((this.w * this.h) / 68000)));
  }

  createParticle(initial = false) {
    const shape = pick(SHAPES);
    const size = rand(13, 40) * (shape === 'bubble' ? rand(0.6, 1.4) : 1);
    const progress = initial ? Math.random() : 0;
    return {
      shape,
      size,
      x: rand(-0.05, 1.05) * this.w,
      y: initial ? rand(0, this.h) : this.h + size + rand(0, 80),
      born: performance.now() - progress * 1000,
      ttl: rand(28000, 52000),
      riseSpeed: rand(9, 26),
      driftAngle: rand(-0.6, 0.6),
      wanderAmp: rand(10, 34),
      wanderFreq: rand(0.00012, 0.00028),
      phase: rand(0, TAU),
      spin: rand(-0.00022, 0.00022),
      seed: Math.random(),
    };
  }

  spawnInitial() {
    this.particles = Array.from({ length: this.targetCount() }, () => this.createParticle(true));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.rafId = requestAnimationFrame(this._loop);
  }

  loop(now) {
    if (!this.canvas.isConnected) {
      this.destroy();
      return;
    }

    // Reposição gradual: mantém densidade constante sem "saltos"
    while (this.particles.length < this.targetCount()) {
      this.particles.push(this.createParticle());
    }

    this.drawFrame(now);

    if (this.running) this.rafId = requestAnimationFrame(this._loop);
  }

  drawFrame(now) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    const survivors = [];
    for (const p of this.particles) {
      const age = now - p.born;
      if (age > p.ttl || p.y < -p.size * 2.5) continue;
      survivors.push(p);

      const lifeP = age / p.ttl;                       // 0→1 durante a vida
      const depth = Math.pow(Math.sin(Math.PI * lifeP), 0.85); // longe→frente→longe
      const fade = Math.min(1, Math.min(lifeP, 1 - lifeP) * 8);

      const dtSec = 1 / 60;
      const moveScale = this.reducedMotion ? 0 : 1;
      p.y -= p.riseSpeed * (0.25 + 0.75 * depth) * dtSec * moveScale;
      p.x += Math.sin(p.driftAngle) * p.riseSpeed * 0.35 * depth * dtSec * moveScale;
      const sway = Math.sin(now * p.wanderFreq * TAU + p.phase) * p.wanderAmp * (0.3 + 0.7 * depth);
      const px = p.x + sway;
      const py = p.y;
      const scale = 0.32 + 0.68 * depth;
      const alpha = (0.08 + 0.14 * depth) * fade;
      const s = p.size * scale;
      const rot = p.spin * (now - p.born) * (p.shape === 'bubble' ? 0 : 1);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      this.drawShape(ctx, p.shape, s, p.seed);
      ctx.restore();
    }
    this.particles = survivors;
  }

  /* ---------- desenho das figuras (todas bem ténues) ---------- */

  drawShape(ctx, shape, s, seed) {
    switch (shape) {
      case 'bubble': return this.bubble(ctx, s);
      case 'coin':   return this.coin(ctx, s);
      case 'tag':    return this.tag(ctx, s);
      case 'cart':   return this.cart(ctx, s);
      case 'percent':return this.percent(ctx, s);
      case 'barcode':return this.barcode(ctx, s, seed);
      case 'trend':  return this.trend(ctx, s);
    }
  }

  bubble(ctx, s) {
    const r = s / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.3, r * 0.42, Math.PI * 0.9, Math.PI * 1.5);
    ctx.stroke();
  }

  coin(ctx, s) {
    const r = s / 2;
    const warm = s > 16;
    ctx.fillStyle   = warm ? 'rgba(255,208,110,0.10)' : 'rgba(255,255,255,0.07)';
    ctx.strokeStyle = warm ? 'rgba(255,214,130,0.95)' : 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (s >= 24) {
      ctx.fillStyle = warm ? 'rgba(255,220,150,0.9)' : 'rgba(255,255,255,0.75)';
      ctx.font = `600 ${Math.round(s * 0.44)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Kz', 0, 1);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, TAU);
      ctx.stroke();
    }
  }

  tag(ctx, s) {
    const w = s, h = s * 0.62, r = Math.min(4, s * 0.12);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, [r, h / 2, h / 2, r]);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-w / 2 + r + h * 0.22, 0, Math.max(1.4, h * 0.13), 0, TAU);
    ctx.stroke();
  }

  cart(ctx, s) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const u = s / 26;
    ctx.beginPath();
    ctx.moveTo(-11 * u, -8 * u);
    ctx.lineTo(-7 * u, -8 * u);
    ctx.lineTo(-4 * u, 3 * u);
    ctx.lineTo(8 * u, 3 * u);
    ctx.lineTo(11 * u, -5 * u);
    ctx.lineTo(-5.5 * u, -5 * u);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-1.5 * u, 8 * u, 1.9 * u, 0, TAU);
    ctx.arc(6 * u, 8 * u, 1.9 * u, 0, TAU);
    ctx.fill();
  }

  percent(ctx, s) {
    const warm = s > 18;
    ctx.strokeStyle = warm ? 'rgba(255,214,130,0.95)' : 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    const r = s * 0.16;
    ctx.beginPath();
    ctx.arc(-s * 0.24, -s * 0.24, r, 0, TAU);
    ctx.moveTo(s * 0.30, -s * 0.36);
    ctx.lineTo(-s * 0.30, s * 0.36);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.24, s * 0.24, r, 0, TAU);
    ctx.stroke();
  }

  barcode(ctx, s, seed) {
    const w = s * 0.78, h = s * 0.52;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 3);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.clip();
    let x = -w / 2 + w * 0.14;
    let s2 = seed;
    while (x < w / 2 - w * 0.12) {
      s2 = (s2 * 9301 + 49297) % 233280;
      const bw = 0.8 + (s2 / 233280) * 2.2;
      ctx.fillRect(x, -h / 2 + h * 0.16, bw, h * 0.68);
      x += bw + 1.1;
    }
    ctx.restore();
  }

  /** Descida de preço — a boa notícia do Xé Preço */
  trend(ctx, s) {
    const warm = s > 20;
    ctx.strokeStyle = warm ? 'rgba(140,235,180,0.95)' : 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const u = s / 24;
    ctx.beginPath();
    ctx.moveTo(-11 * u, -8 * u);
    ctx.lineTo(-4 * u, -2 * u);
    ctx.lineTo(0, -5 * u);
    ctx.lineTo(9 * u, 6 * u);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9 * u, 6 * u);
    ctx.lineTo(3.4 * u, 5.4 * u);
    ctx.moveTo(9 * u, 6 * u);
    ctx.lineTo(8.2 * u, 0.6 * u);
    ctx.stroke();
  }
}

/**
 * Liga as partículas a um canvas existente.
 * @param {HTMLCanvasElement|null} canvas
 * @returns {HeroParticles|null}
 */
export function initHeroParticles(canvas) {
  if (!canvas) return null;
  return new HeroParticles(canvas);
}
