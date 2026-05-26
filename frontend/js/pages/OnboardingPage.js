/**
 * @file OnboardingPage.js
 * @description Fluxo de onboarding em 2 passos para novos utilizadores.
 * Layout imersivo sem Navbar/Footer. Validação inline. Auto-login após registo.
 *
 * Passo 1 — Dados básicos (nome, email, palavra-passe)
 * Passo 2 — Preferências (data nascimento, género, morada)
 */

import { api }    from '../api.js';
import { auth }   from '../auth.js';
import { router } from '../router.js';
import { toast }  from '../components/Toast.js';

// Municipios de Angola para o select
const MUNICIPIOS_ANGOLA = [
  'Belas','Cacuaco','Cazenga','Ícolo e Bengo','Kilamba Kiaxi','Luanda','Maianga',
  'Municipality of Luanda','Quiçama','Rangel','Viana','Benguela','Lobito',
  'Huambo','Lubango','Malanje','Cabinda','Uíge','Soyo','Kuito','Menongue',
  'N\'dalatando','Saurimo','Sumbe','Namibe','Ndalatando','Outro'
];

export default class OnboardingPage {
  constructor(container) {
    this.container = container;
    this.step = 1;
    this.formData = {};
  }

  render() {
    if (auth.isAuthenticated()) {
      router.navigate('/');
      return;
    }
    this._renderShell();
    this._renderStep1();
  }

  // ─── Shell da página (sem Navbar/Footer) ────────────────────────────────────
  _renderShell() {
    this.container.innerHTML = `
      <div class="onboarding" id="onboarding-root">
        <!-- Painel lateral decorativo -->
        <aside class="onboarding__aside" aria-hidden="true">
          <div class="onboarding__aside-content">
            <div class="onboarding__brand">
              <span class="brand-price">PRICE</span><span class="brand-360">360</span>
            </div>
            <p class="onboarding__tagline">Compara preços.<br>Poupa dinheiro.<br>Decide melhor.</p>
            <div class="onboarding__bubbles">
              <div class="bubble bubble--1"></div>
              <div class="bubble bubble--2"></div>
              <div class="bubble bubble--3"></div>
            </div>
          </div>
        </aside>

        <!-- Painel principal do formulário -->
        <main class="onboarding__main" id="onboarding-main">
          <!-- Progress bar -->
          <div class="onboarding__progress" aria-label="Progresso do cadastro">
            <div class="onboarding__progress-track">
              <div class="onboarding__progress-fill" id="ob-progress" style="width:50%"></div>
            </div>
            <span class="onboarding__progress-label" id="ob-progress-label">Passo 1 de 2</span>
          </div>

          <!-- Conteúdo dinâmico do step -->
          <div class="onboarding__card" id="onboarding-card"></div>

          <!-- Rodapé de navegação -->
          <p class="onboarding__login-link">
            Já tens conta? <a href="#/login">Entrar →</a>
          </p>
        </main>
      </div>
    `;
  }

  // ─── Passo 1: Dados básicos ─────────────────────────────────────────────────
  _renderStep1() {
    this.step = 1;
    this._updateProgress(1);

    const card = document.getElementById('onboarding-card');
    card.innerHTML = `
      <div class="ob-step ob-step--enter" id="ob-step-1">
        <div class="ob-step__header">
          
          <h1 class="ob-step__title">Olá! Vamos começar</h1>
          <p class="ob-step__subtitle">Cria a tua conta gratuita em menos de 2 minutos.</p>
        </div>

        <div class="ob-fields">
          <div class="ob-row">
            <div class="ob-field" id="field-p_nome">
              <label class="ob-field__label" for="ob-pnome">Primeiro nome</label>
              <div class="ob-field__wrap">
                <input class="ob-field__input" type="text" id="ob-pnome"
                       placeholder="Ana" autocomplete="given-name" />
                <span class="ob-field__check" aria-hidden="true"></span>
              </div>
              <span class="ob-field__hint" id="hint-p_nome"></span>
            </div>
            <div class="ob-field" id="field-u_nome">
              <label class="ob-field__label" for="ob-unome">Último nome</label>
              <div class="ob-field__wrap">
                <input class="ob-field__input" type="text" id="ob-unome"
                       placeholder="Silva" autocomplete="family-name" />
                <span class="ob-field__check" aria-hidden="true"></span>
              </div>
              <span class="ob-field__hint" id="hint-u_nome"></span>
            </div>
          </div>

          <div class="ob-field" id="field-email">
            <label class="ob-field__label" for="ob-email">Email</label>
            <div class="ob-field__wrap">
              <input class="ob-field__input" type="email" id="ob-email"
                     placeholder="ana.silva@email.com" autocomplete="email" />
              <span class="ob-field__check" aria-hidden="true"></span>
            </div>
            <span class="ob-field__hint" id="hint-email"></span>
          </div>

          <div class="ob-field" id="field-palavra_passe">
            <label class="ob-field__label" for="ob-pass">Palavra-passe</label>
            <div class="ob-field__wrap">
              <input class="ob-field__input" type="password" id="ob-pass"
                     placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
              <button type="button" class="ob-field__toggle" id="toggle-pass" aria-label="Mostrar/esconder palavra-passe">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <div class="ob-strength" id="ob-strength">
              <div class="ob-strength__bars">
                <span class="ob-strength__bar" data-index="0"></span>
                <span class="ob-strength__bar" data-index="1"></span>
                <span class="ob-strength__bar" data-index="2"></span>
                <span class="ob-strength__bar" data-index="3"></span>
              </div>
              <span class="ob-strength__label" id="ob-strength-label"></span>
            </div>
            <span class="ob-field__hint" id="hint-palavra_passe"></span>
          </div>

          <div class="ob-field" id="field-confirmar">
            <label class="ob-field__label" for="ob-pass2">Confirmar palavra-passe</label>
            <div class="ob-field__wrap">
              <input class="ob-field__input" type="password" id="ob-pass2"
                     placeholder="Repetir palavra-passe" autocomplete="new-password" />
              <span class="ob-field__check" aria-hidden="true"></span>
            </div>
            <span class="ob-field__hint" id="hint-confirmar"></span>
          </div>
        </div>

        <button class="ob-btn ob-btn--next" id="ob-next-1">
          Continuar
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    `;

    this._bindStep1();
    requestAnimationFrame(() => {
      card.querySelector('.ob-step').classList.add('ob-step--visible');
    });
  }

  // ─── Passo 2: Preferências e morada ────────────────────────────────────────
  _renderStep2() {
    this.step = 2;
    this._updateProgress(2);

    const card = document.getElementById('onboarding-card');

    // Slide out
    const prev = card.querySelector('.ob-step');
    if (prev) {
      prev.classList.add('ob-step--exit-left');
      setTimeout(() => this._renderStep2Content(card), 300);
    } else {
      this._renderStep2Content(card);
    }
  }

  _renderStep2Content(card) {
    const municipiosOptions = MUNICIPIOS_ANGOLA
      .map(m => `<option value="${m}">${m}</option>`)
      .join('');

    card.innerHTML = `
      <div class="ob-step ob-step--enter-right" id="ob-step-2">
        <div class="ob-step__header">
          
          <h1 class="ob-step__title">Quase lá!</h1>
          <p class="ob-step__subtitle">Mais alguns detalhes para personalizar a tua experiência.</p>
        </div>

        <div class="ob-fields">
          <div class="ob-row">
            <div class="ob-field" id="field-data_nascimento">
              <label class="ob-field__label" for="ob-nasc">Data de nascimento</label>
              <div class="ob-field__wrap">
                <input class="ob-field__input" type="date" id="ob-nasc"
                       autocomplete="bday" max="${new Date().toISOString().split('T')[0]}" />
                <span class="ob-field__check" aria-hidden="true"></span>
              </div>
              <span class="ob-field__hint" id="hint-data_nascimento"></span>
            </div>
            <div class="ob-field" id="field-genero">
              <label class="ob-field__label" for="ob-genero">Género</label>
              <div class="ob-field__wrap">
                <select class="ob-field__input ob-field__select" id="ob-genero">
                  <option value="">Selecionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
                <span class="ob-field__check" aria-hidden="true"></span>
              </div>
              <span class="ob-field__hint" id="hint-genero"></span>
            </div>
          </div>

          <div class="ob-field" id="field-rua">
            <label class="ob-field__label" for="ob-rua">Rua / Endereço</label>
            <div class="ob-field__wrap">
              <input class="ob-field__input" type="text" id="ob-rua"
                     placeholder="Rua das Flores, 123" autocomplete="street-address" />
              <span class="ob-field__check" aria-hidden="true"></span>
            </div>
            <span class="ob-field__hint" id="hint-rua"></span>
          </div>

          <div class="ob-row">
            <div class="ob-field" id="field-municipio">
              <label class="ob-field__label" for="ob-municipio">Município</label>
              <div class="ob-field__wrap">
                <select class="ob-field__input ob-field__select" id="ob-municipio">
                  <option value="">Selecionar...</option>
                  ${municipiosOptions}
                </select>
                <span class="ob-field__check" aria-hidden="true"></span>
              </div>
              <span class="ob-field__hint" id="hint-municipio"></span>
            </div>
            <div class="ob-field" id="field-municipio_preferencial">
              <label class="ob-field__label" for="ob-mun-pref">
                Município preferencial
                <span class="ob-field__optional">(opcional)</span>
              </label>
              <div class="ob-field__wrap">
                <select class="ob-field__input ob-field__select" id="ob-mun-pref">
                  <option value="">Mesmo que residência</option>
                  ${municipiosOptions}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="ob-actions">
          <button class="ob-btn ob-btn--back" id="ob-back-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Voltar
          </button>
          <button class="ob-btn ob-btn--submit" id="ob-submit">
            Criar conta
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      card.querySelector('.ob-step').classList.add('ob-step--visible');
    });

    this._bindStep2();
  }

  // ─── Bindings Step 1 ────────────────────────────────────────────────────────
  _bindStep1() {
    const get = (id) => document.getElementById(id);

    // Validação inline ao sair do campo
    this._bindInlineValidation('ob-pnome',  'p_nome',       this._validateName);
    this._bindInlineValidation('ob-unome',  'u_nome',       this._validateName);
    this._bindInlineValidation('ob-email',  'email',        this._validateEmail);
    this._bindInlineValidation('ob-pass2',  'confirmar',    (v) => this._validateConfirm(v));

    // Força da palavra-passe em tempo real
    get('ob-pass')?.addEventListener('input', (e) => {
      this._updateStrength(e.target.value);
      this._validateFieldNow('ob-pass', 'palavra_passe', (v) => this._validatePassword(v));
      // Re-validar confirmação se já foi preenchida
      const pass2 = get('ob-pass2')?.value;
      if (pass2) this._validateFieldNow('ob-pass2', 'confirmar', (v) => this._validateConfirm(v));
    });
    get('ob-pass')?.addEventListener('blur', () => {
      this._validateFieldNow('ob-pass', 'palavra_passe', (v) => this._validatePassword(v));
    });

    // Toggle visibilidade da password
    get('toggle-pass')?.addEventListener('click', () => {
      const input = get('ob-pass');
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Botão próximo
    get('ob-next-1')?.addEventListener('click', () => this._validateAndProceedStep1());
  }

  // ─── Bindings Step 2 ────────────────────────────────────────────────────────
  _bindStep2() {
    const get = (id) => document.getElementById(id);

    this._bindInlineValidation('ob-nasc',       'data_nascimento', this._validateDate);
    this._bindInlineValidation('ob-genero',     'genero',          (v) => v ? null : 'Seleciona o género.');
    this._bindInlineValidation('ob-rua',        'rua',             (v) => v?.trim().length >= 3 ? null : 'Endereço inválido.');
    this._bindInlineValidation('ob-municipio',  'municipio',       (v) => v ? null : 'Seleciona o município.');

    get('ob-back-2')?.addEventListener('click', () => this._goBackToStep1());
    get('ob-submit')?.addEventListener('click', () => this._validateAndSubmit());
  }

  // ─── Helpers de validação ───────────────────────────────────────────────────
  _validateName(v)  { return v?.trim().length >= 2 ? null : 'Mínimo 2 caracteres.'; }
  _validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v?.trim()) ? null : 'Email inválido.';
  }
  _validatePassword(v) {
    if (!v || v.length < 8) return 'Mínimo 8 caracteres.';
    return null;
  }
  _validateConfirm(v) {
    const pass = document.getElementById('ob-pass')?.value;
    return v === pass ? null : 'As palavras-passe não coincidem.';
  }
  _validateDate(v) {
    if (!v) return 'Data obrigatória.';
    const d = new Date(v);
    const now = new Date();
    if (isNaN(d)) return 'Data inválida.';
    const age = (now - d) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 13) return 'Tens de ter pelo menos 13 anos.';
    if (age > 120) return 'Data de nascimento inválida.';
    return null;
  }

  _bindInlineValidation(inputId, fieldKey, validator) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const validate = typeof validator === 'function' ? validator.bind(this) : validator;
    input.addEventListener('blur',  () => this._validateFieldNow(inputId, fieldKey, validate));
    input.addEventListener('input', () => {
      // Limpa erro ao começar a escrever (feedback positivo)
      const field = document.getElementById(`field-${fieldKey}`);
      if (field?.classList.contains('ob-field--error')) {
        this._validateFieldNow(inputId, fieldKey, validate);
      }
    });
  }

  _validateFieldNow(inputId, fieldKey, validator) {
    const input   = document.getElementById(inputId);
    const field   = document.getElementById(`field-${fieldKey}`);
    const hint    = document.getElementById(`hint-${fieldKey}`);
    if (!input || !field) return true;

    const error = validator(input.value);
    field.classList.toggle('ob-field--error',   !!error);
    field.classList.toggle('ob-field--success', !error && input.value.length > 0);
    if (hint) hint.textContent = error || '';
    return !error;
  }

  _updateStrength(value) {
    const bars   = document.querySelectorAll('.ob-strength__bar');
    const label  = document.getElementById('ob-strength-label');
    if (!bars.length || !label) return;

    let score = 0;
    if (value.length >= 8)          score++;
    if (/[A-Z]/.test(value))        score++;
    if (/[0-9]/.test(value))        score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    const levels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
    const colors = ['', '#f44336', '#ff9800', '#2196f3', '#4caf50'];

    bars.forEach((bar, i) => {
      bar.style.background = i < score ? colors[score] : '';
      bar.classList.toggle('ob-strength__bar--active', i < score);
    });
    label.textContent  = value.length ? levels[score] : '';
    label.style.color  = colors[score];
  }

  // ─── Fluxo de navegação ─────────────────────────────────────────────────────
  _validateAndProceedStep1() {
    const ok = [
      this._validateFieldNow('ob-pnome', 'p_nome',       (v) => this._validateName(v)),
      this._validateFieldNow('ob-unome', 'u_nome',       (v) => this._validateName(v)),
      this._validateFieldNow('ob-email', 'email',        (v) => this._validateEmail(v)),
      this._validateFieldNow('ob-pass',  'palavra_passe',(v) => this._validatePassword(v)),
      this._validateFieldNow('ob-pass2', 'confirmar',    (v) => this._validateConfirm(v)),
    ].every(Boolean);

    if (!ok) {
      // Foca o primeiro campo com erro
      const errField = document.querySelector('.ob-field--error .ob-field__input');
      errField?.focus();
      return;
    }

    this.formData.p_nome       = document.getElementById('ob-pnome').value.trim();
    this.formData.u_nome       = document.getElementById('ob-unome').value.trim();
    this.formData.email        = document.getElementById('ob-email').value.trim().toLowerCase();
    this.formData.palavra_passe= document.getElementById('ob-pass').value;

    this._renderStep2();
  }

  _goBackToStep1() {
    this.step = 1;
    this._updateProgress(1);
    const card = document.getElementById('onboarding-card');
    const prev = card.querySelector('.ob-step');
    if (prev) {
      prev.classList.add('ob-step--exit-right');
      setTimeout(() => this._renderStep1AndRestore(card), 300);
    }
  }

  _renderStep1AndRestore(card) {
    this._renderStep1();
    // Restaurar valores já preenchidos
    setTimeout(() => {
      const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      setVal('ob-pnome', this.formData.p_nome);
      setVal('ob-unome', this.formData.u_nome);
      setVal('ob-email', this.formData.email);
      setVal('ob-pass',  this.formData.palavra_passe);
      setVal('ob-pass2', this.formData.palavra_passe);
      if (this.formData.palavra_passe) this._updateStrength(this.formData.palavra_passe);
      // Marcar como válidos
      ['p_nome','u_nome','email','palavra_passe','confirmar'].forEach(k => {
        const field = document.getElementById(`field-${k}`);
        if (field) field.classList.add('ob-field--success');
      });
    }, 50);
  }

  // ─── Submissão final ────────────────────────────────────────────────────────
  async _validateAndSubmit() {
    const ok = [
      this._validateFieldNow('ob-nasc',      'data_nascimento', (v) => this._validateDate(v)),
      this._validateFieldNow('ob-genero',    'genero',          (v) => v ? null : 'Seleciona o género.'),
      this._validateFieldNow('ob-rua',       'rua',             (v) => v?.trim().length >= 3 ? null : 'Endereço inválido.'),
      this._validateFieldNow('ob-municipio', 'municipio',       (v) => v ? null : 'Seleciona o município.'),
    ].every(Boolean);

    if (!ok) {
      const errField = document.querySelector('.ob-field--error .ob-field__input, .ob-field--error .ob-field__select');
      errField?.focus();
      return;
    }

    const submitBtn = document.getElementById('ob-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="ob-spinner"></span> A criar conta...`;

    const payload = {
      ...this.formData,
      data_nascimento:        document.getElementById('ob-nasc').value,
      genero:                 document.getElementById('ob-genero').value,
      rua:                    document.getElementById('ob-rua').value.trim(),
      municipio:              document.getElementById('ob-municipio').value,
      municipio_preferencial: document.getElementById('ob-mun-pref').value || undefined,
    };

    try {
      const res = await api.post('/auth/register', payload);

      // Auto-login: guardar token e user
      auth.setAuth(res.data.token, res.data.user);

      // Ecrã de boas-vindas animado
      this._showSuccessScreen(res.data.user.p_nome);
    } catch (err) {
      const msg = err.details?.[0] || err.message || 'Erro ao criar conta.';
      toast.error(msg);
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Criar conta <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`;
    }
  }

  _showSuccessScreen(nome) {
    const card = document.getElementById('onboarding-card');
    card.innerHTML = `
      <div class="ob-success">
        <div class="ob-success__checkmark">
          <svg viewBox="0 0 52 52" class="ob-checkmark-svg">
            <circle class="ob-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="ob-checkmark-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h2 class="ob-success__title">Bem-vindo, ${nome}!</h2>
        <p class="ob-success__sub">A tua conta foi criada. Estás a entrar…</p>
      </div>
    `;
    setTimeout(() => { window.location.hash = '#/'; window.location.reload(); }, 2000);
  }

  _updateProgress(step) {
    const fill  = document.getElementById('ob-progress');
    const label = document.getElementById('ob-progress-label');
    if (fill)  fill.style.width  = step === 1 ? '50%' : '100%';
    if (label) label.textContent = `Passo ${step} de 2`;
  }
}