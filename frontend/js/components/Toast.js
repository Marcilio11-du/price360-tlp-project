/**
 * @file components/Toast.js
 * @description Singleton de notificações temporárias (toast).
 * Injeta os toasts no elemento #toast-root definido no index.html.
 *
 * Uso:
 *   import { toast } from './components/Toast.js';
 *   toast.success('Produto adicionado!');
 *   toast.error('Erro ao guardar.');
 */

/** Duração visível de cada toast em milissegundos */
const DURATION = 3500;

/** Referência ao contentor DOM (lazy init) */
let container = null;

/**
 * Devolve (ou localiza) o contentor de toasts no DOM.
 * @returns {HTMLElement|null}
 */
const getContainer = () => {
  if (!container) container = document.getElementById('toast-root');
  return container;
};

/** Ícones SVG por tipo de toast */
const ICONS = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>`,
  error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>`,
  info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`
};

/**
 * Remove um toast do DOM com animação de saída.
 * @param {HTMLElement} el
 */
const dismiss = (el) => {
  el.classList.add('toast--hiding');
  el.addEventListener('animationend', () => el.remove(), { once: true });
};

/**
 * Cria e apresenta um toast.
 * @param {string} message - Texto da notificação
 * @param {'success'|'error'|'info'|'warning'} type
 */
const show = (message, type) => {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `
    <span class="toast__icon">${ICONS[type] || ICONS.info}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" aria-label="Fechar">✕</button>
  `;

  el.querySelector('.toast__close').addEventListener('click', () => dismiss(el));

  getContainer()?.appendChild(el);

  // Auto-dismiss após DURATION ms
  setTimeout(() => dismiss(el), DURATION);
};

export const toast = {
  /** @param {string} msg */
  success: (msg) => show(msg, 'success'),
  /** @param {string} msg */
  error:   (msg) => show(msg, 'error'),
  /** @param {string} msg */
  info:    (msg) => show(msg, 'info'),
  /** @param {string} msg */
  warning: (msg) => show(msg, 'warning')
};
