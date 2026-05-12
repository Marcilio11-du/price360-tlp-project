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
 */
export const initAnimations = () => {
  observer = createObserver();
  observeNewElements();
};

/**
 * Re-observa todos os elementos animáveis ainda não visíveis.
 * Deve ser chamado após cada render de página para cobrir elementos novos.
 */
export const observeNewElements = () => {
  // Cria observer se ainda não existir (chamada antes de initAnimations)
  if (!observer) observer = createObserver();

  ANIMATION_CLASSES.forEach((cls) => {
    document.querySelectorAll(`.${cls}:not(.is-visible)`).forEach((el) => {
      observer.observe(el);
    });
  });
};
