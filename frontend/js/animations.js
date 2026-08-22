/**
 * @file animations.js
 * @description Configura um IntersectionObserver global que adiciona a classe
 * `is-visible` aos elementos com classes de animação assim que entram na viewport.
 * Cada elemento é animado apenas uma vez (unobserve após primeiro intersection).
 *
 * Classes CSS observadas:
 *   .animate-scroll  — fade + slide genérico
 *   .animate-fade    — apenas fade
 *   .animate-left    — slide da esquerda
 *   .animate-right   — slide da direita
 *   .animate-scale   — scale + fade
 */

/** Singleton do observer, inicializado em initAnimations() */
let observer = null;

/** Classes CSS que marcam elementos para animar */
const ANIMATION_CLASSES = [
  'animate-scroll',
  'animate-fade',
  'animate-left',
  'animate-right',
  'animate-scale'
];

/**
 * Auto-animacao site-wide: seletores comuns recebem uma classe de animação
 * subtil se ainda não tiverem uma. Mantém o efeito consistente sem ter de
 * editar página a página.
 */
const AUTO_ANIMATE_SELECTORS = [
  ['.section-header', 'animate-fade'],
  ['.products-section__header', 'animate-fade'],
  ['.about-section__header', 'animate-fade'],
  ['.products-page__header', 'animate-fade'],
  ['.categories-grid > *', 'animate-scale'],
  ['.products-grid > *', 'animate-scroll'],
  ['.products-page__grid > *', 'animate-scroll'],
  ['.detail-stats > *', 'animate-scale'],
  ['.offers .offer', 'animate-scroll'],
  ['.list-card', 'animate-scroll'],
  ['.about-stats > *', 'animate-scroll'],
  ['.about-steps > *', 'animate-scroll'],
  ['.footer__inner > *', 'animate-fade']
];

/** Zonas onde NUNCA deve haver auto-animação (feedback, overlays, skeletons) */
const AUTO_ANIMATE_EXCLUDE = '#toast-root, #modal-root, .navbar, [class*="skeleton"], [class*="loader"]';

/**
 * Aplica classes de animação automáticas a elementos que ainda não têm uma.
 */
const applyAutoAnimations = () => {
  AUTO_ANIMATE_SELECTORS.forEach(([selector, cls]) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.closest(AUTO_ANIMATE_EXCLUDE)) return;
      const hasAnimationClass = [...el.classList].some((c) => c.startsWith('animate-'));
      if (hasAnimationClass) return;
      el.classList.add(cls);
    });
  });
};

/**
 * Cria e devolve um novo IntersectionObserver configurado para as animações.
 * @returns {IntersectionObserver}
 */
const createObserver = () =>
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Anima só uma vez — para de observar após activação
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold:   0.1,             // activa quando 10 % do elemento é visível
      rootMargin: '0px 0px -50px 0px' // margem inferior negativa para trigger ligeiramente antes
    }
  );

/**
 * Inicializa o observer global e observa todos os elementos já presentes no DOM.
 * Deve ser chamado uma vez no arranque da aplicação (em app.js).
 * Regista também um sweep automático após cada mudança de rota, para cobrir
 * páginas que não invocam observeNewElements explicitamente.
 */
export const initAnimations = () => {
  observer = createObserver();
  observeNewElements();

  // Páginas renderizadas de forma síncrona/sem sweep próprio
  window.addEventListener('hashchange', () => {
    setTimeout(observeNewElements, 250);
    setTimeout(observeNewElements, 900); // dados async chegam depois
  });
};

/**
 * Re-observa todos os elementos animáveis ainda não visíveis.
 * Deve ser chamado após cada render de página para cobrir elementos novos.
 */
export const observeNewElements = () => {
  // Cria observer se ainda não existir (chamada antes de initAnimations)
  if (!observer) observer = createObserver();

  // Auto-tagging site-wide antes de observar
  applyAutoAnimations();

  ANIMATION_CLASSES.forEach((cls) => {
    document.querySelectorAll(`.${cls}:not(.is-visible)`).forEach((el) => {
      observer.observe(el);
    });
  });
};
