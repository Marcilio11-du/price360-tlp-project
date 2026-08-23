/**
 * @file components/CursorGlow.js
 * @description Luz ambiente que segue o cursor ao longo do fundo do site.
 * Um halo suave (mix-blend screen) desloca-se com atraso elegante (lerp),
 * dá presença sem distrair. Desativado em ecrãs touch e com
 * prefers-reduced-motion. Auto-destroi-se se o nó sair do DOM.
 */

const GLOW_SIZE = 520;
const LERP_FACTOR = 0.085;

class CursorGlow {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'cursor-glow';
    this.el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.el);

    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 3;
    this.targetX = this.x;
    this.targetY = this.y;
    this.rafId = null;
    this.visible = false;

    this._onMove = (e) => {
      this.targetX = e.clientX;
      this.targetY = e.clientY;
      if (!this.visible) {
        this.visible = true;
        this.el.classList.add('cursor-glow--on');
      }
    };
    this._onLeave = () => {
      this.visible = false;
      this.el.classList.remove('cursor-glow--on');
    };

    document.addEventListener('mousemove', this._onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', this._onLeave);
    this.start();
  }

  start() {
    const tick = () => {
      if (!this.el.isConnected) return; // saiu do DOM → para sozinho

      // Segue o rato com inércia (movimento orgânico, nunca "colado")
      this.x += (this.targetX - this.x) * LERP_FACTOR;
      this.y += (this.targetY - this.y) * LERP_FACTOR;
      this.el.style.transform =
        `translate3d(${(this.x - GLOW_SIZE / 2).toFixed(1)}px, ${(this.y - GLOW_SIZE / 2).toFixed(1)}px, 0)`;

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}

/**
 * Liga a luz que segue o cursor. Respeita reduced-motion/touch.
 * @returns {CursorGlow|null}
 */
export function initCursorGlow() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || reduced) return null;
  return new CursorGlow();
}
