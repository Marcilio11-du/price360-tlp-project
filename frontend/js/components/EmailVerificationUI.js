/**
 * @file components/EmailVerificationUI.js
 * @description UI partilhada para o fluxo de verificação de email:
 * painel "confirma o teu email" com botão de reenvio e lógica de chamada
 * à API. Usado no registo, no login (quando bloqueado por verificação)
 * e na página de verificação.
 */

import { api } from '../api.js';
import { toast } from './Toast.js';

const MAIL_ICON = `
  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5"/>
    <path d="m4 7 8 6 8-6"/>
  </svg>`;

/**
 * Pede à API o reenvio do link de verificação.
 * @param {string} email
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export const requestResend = async (email) => {
  try {
    const res = await api.post('/auth/resend-verification', { email });
    return { ok: true, message: res.message || 'Link reenviado.' };
  } catch (err) {
    return { ok: false, message: err.details?.[0] || err.message || 'Falha ao reenviar.' };
  }
};

/**
 * Mostra o painel "verifica o teu email" dentro de um contentor,
 * substituindo o seu conteúdo. Inclui botão de reenvio com estado.
 *
 * @param {HTMLElement} container
 * @param {{ email?: string, titulo?: string, texto?: string }} [opts]
 */
export const renderCheckEmailPanel = (container, opts = {}) => {
  const email = opts.email || '';
  container.innerHTML = `
    <div class="check-email-panel">
      <div class="check-email-panel__icon">${MAIL_ICON}</div>
      <h2 class="auth-card__title">Confirma o teu <span>email</span></h2>
      <p class="check-email-panel__text">
        Enviámos um link de confirmação para
        ${email ? `<strong>${email}</strong>.` : 'o teu email.'}
        Abre-o e clica em <strong>“Confirmar o meu email”</strong> para activar a conta.
      </p>
      <p class="check-email-panel__hint">O link expira em 24 horas. Não recebeste nada? Verifica a caixa de spam ou reenvia.</p>
      <button type="button" class="auth-card__submit check-email-panel__resend" style="margin-top:.75rem">
        Reenviar email
      </button>
      <p class="check-email-panel__status" style="display:none"></p>
      <div class="auth-card__footer">
        Já confirmaste? <a href="#/login">Entrar</a>
      </div>
    </div>`;

  const btn = container.querySelector('.check-email-panel__resend');
  const status = container.querySelector('.check-email-panel__status');

  btn.addEventListener('click', async () => {
    if (!email) {
      toast.error('Sem email associado — entra em contacto com o suporte.');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'A enviar...';
    const result = await requestResend(email);
    status.style.display = 'block';
    status.textContent = result.message;
    status.className = `check-email-panel__status ${result.ok ? 'is-ok' : 'is-err'}`;
    toast[result.ok ? 'success' : 'error'](result.message);
    btn.disabled = false;
    btn.textContent = 'Reenviar novamente';
  });
};
