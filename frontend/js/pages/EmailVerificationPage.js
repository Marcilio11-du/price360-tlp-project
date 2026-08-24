/**
 * @file pages/EmailVerificationPage.js
 * @description Página aberta pelo link enviado ao email do utilizador.
 * Lê o token da query, valida-o na API e apresenta o resultado de forma
 * clara (a validar → sucesso → erro/expirado com opção de reenvio).
 * Rota: #/verificar-email?token=...
 */

import { api } from '../api.js';
import { router } from '../router.js';
import { requestResend } from '../components/EmailVerificationUI.js';
import { check } from '../components/icons.js';

const ICON_OK = `
  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5"/>
  </svg>`;

const ICON_ERR = `
  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 8v4M12 16h.01"/>
  </svg>`;

export default class EmailVerificationPage {
  constructor(container) { this.container = container; }

  render() {
    // Navbar e footer são globais (app.js) — esta página só gere o cartão.
    this.container.innerHTML = '<div class="email-verify-page"><div class="auth-card"></div></div>';
    const card = this.container.querySelector('.auth-card');
    const token = router.getQueryParams().token;

    if (!token) {
      this._renderState(card, 'err', 'Link incompleto',
        'Este endereço não contém o código de verificação. Usa o link completo enviado para o teu email.');
      return;
    }

    this._renderLoading(card);
    this._verify(card, token);
  }

  _renderLoading(card) {
    card.innerHTML = `
      <div style="padding:1rem 0">
        <div class="email-verify-page__spinner"></div>
        <h2 class="email-verify-page__title">A confirmar o teu email...</h2>
        <p class="email-verify-page__msg">Só um instante.</p>
      </div>`;
  }

  async _verify(card, token) {
    try {
      const res = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
      this._renderState(card, 'ok', `Email confirmado! <span class="icon">${check}</span>`,
        res.message || 'A tua conta está activa. Já podes entrar no Xé Preço.',
        [{ label: 'Entrar na minha conta', href: '#/login', primary: true }]);
    } catch (err) {
      const msg = err.status === 410 || err.status === 404
        ? 'Este link é inválido ou já expirou (os links duram 24 horas). Podes pedir um novo abaixo.'
        : err.details?.[0] || err.message || 'Não foi possível confirmar o email.';
      this._renderErrorWithResend(card, msg);
    }
  }

  _renderState(card, type, title, message, actions = []) {
    card.innerHTML = `
      <div style="padding:1rem 0">
        <div class="email-verify-page__state-icon email-verify-page__state-icon--${type}">
          ${type === 'ok' ? ICON_OK : ICON_ERR}
        </div>
        <h2 class="email-verify-page__title">${title}</h2>
        <p class="email-verify-page__msg">${message}</p>
        ${actions.map(a => `<a href="${a.href}" class="${a.primary ? 'btn btn--primary' : ''}"
            style="${a.primary ? '' : 'display:inline-block;margin-top:.5rem;color:#16a34a;font-weight:700'}">${a.label}</a>`).join(' ')}
      </div>`;
  }

  _renderErrorWithResend(card, message) {
    card.innerHTML = `
      <div style="padding:1rem 0">
        <div class="email-verify-page__state-icon email-verify-page__state-icon--err">${ICON_ERR}</div>
        <h2 class="email-verify-page__title">Não foi possível confirmar</h2>
        <p class="email-verify-page__msg">${message}</p>
        <form id="resend-form" class="auth-form">
          <div class="form-group">
            <label for="resend-email">O teu email</label>
            <input type="email" id="resend-email" placeholder="email@exemplo.com" required />
          </div>
          <button type="submit" class="auth-card__submit">Reenviar link de verificação</button>
        </form>
        <p class="check-email-panel__status" id="resend-status" style="display:none"></p>
        <div class="auth-card__footer"><a href="#/login">Voltar ao login</a></div>
      </div>`;

    card.querySelector('#resend-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = card.querySelector('#resend-email').value.trim();
      const status = card.querySelector('#resend-status');
      if (!email) return;
      status.style.display = 'block';
      status.className = 'check-email-panel__status is-ok';
      status.textContent = 'A enviar...';
      const result = await requestResend(email);
      status.className = `check-email-panel__status ${result.ok ? 'is-ok' : 'is-err'}`;
      status.textContent = result.message;
    });
  }
}
