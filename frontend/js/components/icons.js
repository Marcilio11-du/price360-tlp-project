/**
 * @file icons.js
 * @description Biblioteca única de ícones SVG (stroke, currentColor) do site.
 * Usar SEMPRE estes ícones — nunca emojis — para garantir consistência visual.
 *
 * Exemplo: import { mail } from '../components/icons.js';
 *          `<span class="icon">${mail}</span>`
 */

const svg = (paths, viewBox = '0 0 24 24') =>
  `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const mail    = svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>');
export const phone   = svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.25a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9Z"/>');
export const globe   = svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>');
export const pin     = svg('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>');
export const bell    = svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>');
export const trendDown = svg('<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>');
export const plus    = svg('<path d="M12 5v14M5 12h14"/>');
export const refresh = svg('<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>');
export const warning = svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>');
export const check   = svg('<path d="M20 6 9 17l-5-5"/>');
export const x       = svg('<path d="M18 6 6 18M6 6l12 12"/>');
export const heart   = svg('<path d="M19 14c1.5-1.5 2-3.2 2-4.5A4.5 4.5 0 0 0 16.5 5c-1.7 0-3 .8-4.5 2.5C10.5 5.8 9.2 5 7.5 5A4.5 4.5 0 0 0 3 9.5c0 1.3.5 3 2 4.5l7 6.5Z"/>');
export const search  = svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>');
export const trash   = svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>');
export const box = svg('<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>');
export const star = svg('<path fill="currentColor" stroke="none" d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"/>');

/**
 * Linha de estrelas (avaliações) — cheias/vazias, consistente em todo o site.
 * @param {number} nota 0–5
 */
export const starsHtml = (nota) => {
  const n = Math.max(0, Math.min(5, Math.round(Number(nota) || 0)));
  const star = (filled) => svg(
    `<path${filled ? ' fill="currentColor"' : ''} d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"/>`,
  );
  return `<span class="stars-icon" role="img" aria-label="${n} de 5 estrelas">${
    Array.from({ length: 5 }, (_, i) => star(i < n)).join('')
  }</span>`;
};
