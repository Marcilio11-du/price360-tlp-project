/**
 * @file components/SocialAuthButtons.js
 * @description Secção "ou continua com" das páginas de autenticação.
 * Pergunta à API que providers estão configurados e mostra apenas esses;
 * sem credenciais no .env a secção simplesmente não aparece.
 */

import { api, getApiBase } from "../api.js";

const GOOGLE_LOGO = `
<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.5l6.3 5.3C36.9 40.2 44 35 44 24c0-1.2-.1-2.3-.4-3.5z"/>
</svg>`;

const APPLE_LOGO = `
<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M16.4 12.9c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9C6.3 7.2 4.6 8.2 3.7 9.8c-2 3.4-.5 8.5 1.4 11.3.9 1.4 2 2.9 3.5 2.8 1.4-.1 1.9-.9 3.6-.9s2.2.9 3.6.9c1.5 0 2.4-1.3 3.3-2.7 1.1-1.6 1.5-3.1 1.5-3.2-.1 0-2.8-1.1-2.8-4.1zM13.7 5.4c.8-1 1.3-2.3 1.2-3.6-1.1 0-2.5.8-3.3 1.7-.7.8-1.4 2.2-1.2 3.5 1.3.1 2.5-.6 3.3-1.6z"/>
</svg>`;

/**
 * Preenche o slot `.social-auth-slot` dentro do container dado.
 * @param {HTMLElement} container - Raiz da página (auth-card)
 */
export async function renderSocialAuthButtons(container) {
  const slot = container.querySelector(".social-auth-slot");
  if (!slot) return;

  let providers = { google: false, apple: false };
  try {
    const res = await api.get("/auth/oauth/providers");
    providers = res.data || providers;
  } catch {
    return; // API indisponível → não mostramos nada
  }

  const base = getApiBase();
  const buttons = [];
  if (providers.google) {
    buttons.push(`
      <a class="btn btn--outline social-btn" href="${base}/auth/oauth/google" data-provider="google">
        ${GOOGLE_LOGO} Continuar com Google
      </a>`);
  }
  if (providers.apple) {
    buttons.push(`
      <a class="btn btn--outline social-btn social-btn--apple" href="${base}/auth/oauth/apple" data-provider="apple">
        ${APPLE_LOGO} Continuar com Apple
      </a>`);
  }
  if (!buttons.length) return;

  slot.innerHTML = `
    <div class="social-auth">
      <span class="social-auth__divider"><span>ou continua com</span></span>
      <div class="social-auth__btns">${buttons.join("")}</div>
    </div>`;
}
