/**
 * @file components/Toast.js
 * @description Notificações temporárias (toast) com entrada/saída suaves,
 * barra de vida que pausa ao passar o rato e empilhamento elegante
 * no #toast-root. API: toast.success / error / info / warning.
 */

/** Duração visível de cada toast (ms). Pausa enquanto o rato está sobre ele. */
const DURATION = 4200;

/** Duração das animações de entrada/saída — deve bater certo com o CSS */
const EXIT_DURATION = 320;

let container = null;

/** Ícones SVG por tipo (traço fino, arredondado) */
const ICONS = {
  success: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  info:    `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="10.5" x2="12" y2="16.5"/><line x1="12" y1="7.5" x2="12.01" y2="7.5"/></svg>`,
  warning: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13.5"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

const getContainer = () => {
  if (!container) container = document.getElementById('toast-root');
  return container;
};

/**
 * Remove um toast do DOM com animação de saída suave.
 * @param {HTMLElement} el
 */
const dismiss = (el) => {
  if (!el.isConnected || el.classList.contains('toast--hiding')) return;
  clearTimeout(el._timer);
  el.classList.add('toast--hiding');
  setTimeout(() => el.remove(), EXIT_DURATION);
};

/**
 * Cria e apresenta um toast.
 * @param {string} message - Texto da notificação
 * @param {'success'|'error'|'info'|'warning'} type
 */
const show = (message, type) => {
  const root = getContainer();
  if (!root) return;

  // Máximo de 4 toasts visíveis — os mais antigos cedem o lugar
  while (root.children.length >= 4) dismiss(root.firstElementChild);

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `
    <span class="toast__icon">${ICONS[type] || ICONS.info}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" aria-label="Fechar">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <span class="toast__life" aria-hidden="true"></span>
  `;

  // Fechar manualmente ou por hover-out após pausa
  el.querySelector('.toast__close').addEventListener('click', () => dismiss(el));

  const startTimer = () => {
    clearTimeout(el._timer);
    el._timer = setTimeout(() => dismiss(el), DURATION);
    el.style.setProperty('--life-duration', `${DURATION}ms`);
    el.classList.remove('toast--paused');
  };

  el.addEventListener('mouseenter', () => {
    clearTimeout(el._timer);
    el.classList.add('toast--paused');
  });
  el.addEventListener('mouseleave', startTimer);

  root.appendChild(el);
  // Dois frames: garante que a transição de entrada dispara
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.add('is-in');
    startTimer();
  }));
};

export const toast = {
  /** @param {string} msg */
  success: (msg) => show(msg, 'success'),
  /** @param {string} msg */
  error:   (msg) => show(msg, 'error'),
  /** @param {string} msg */
  info:    (msg) => show(msg, 'info'),
  /** @param {string} msg */
  warning: (msg) => show(msg, 'warning'),
};
