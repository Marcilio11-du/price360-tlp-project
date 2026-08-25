import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { toast } from "../components/Toast.js";
import { mail } from "../components/icons.js";
import { Navbar } from "../components/Navbar.js";
import { requestResend } from "../components/EmailVerificationUI.js";
import { observeNewElements } from "../animations.js";

export default class LoginPage {
  constructor(container) {
    this.container = container;
  }

  render() {
    if (auth.isAuthenticated()) {
      router.navigate("/");
      return;
    }

    this.container.innerHTML = `
      <div class="onboarding" id="login-root">
        <aside class="onboarding__aside" aria-hidden="true">
          <div class="onboarding__aside-content">
            <div class="onboarding__brand">
              <span class="brand-price">XÉ</span><span class="brand-360">PREÇO</span>
            </div>
            <p class="onboarding__tagline">Compara preços.<br>Poupa dinheiro.<br>Decide melhor.</p>
            <div class="onboarding__bubbles">
              <div class="bubble bubble--1"></div>
              <div class="bubble bubble--2"></div>
              <div class="bubble bubble--3"></div>
            </div>
          </div>
        </aside>

        <main class="onboarding__main">
          <div class="onboarding__card">
            <div class="ob-step ob-step--visible">
              <div class="ob-step__header">
                <img class="login-logo" src="./assets/logo.png" alt="Xé Preço"
                  onerror="this.style.display='none'" />
                <h1 class="ob-step__title">Bem-vindo de volta</h1>
                <p class="ob-step__subtitle">Entra na tua conta para gerir as tuas listas de compras.</p>
              </div>

              <form class="ob-fields login-fields" id="login-form" novalidate>
                <div class="ob-field">
                  <label class="ob-field__label" for="login-email">Email</label>
                  <div class="ob-field__wrap">
                    <input class="ob-field__input" type="email" id="login-email"
                           placeholder="email@exemplo.com" required autocomplete="email" />
                  </div>
                </div>
                <div class="ob-field">
                  <label class="ob-field__label" for="login-password">Palavra-passe</label>
                  <div class="ob-field__wrap">
                    <input class="ob-field__input" type="password" id="login-password"
                           placeholder="A tua palavra-passe" required autocomplete="current-password" />
                  </div>
                </div>
                <button type="submit" class="ob-btn ob-btn--submit ob-btn--full" id="login-submit">Entrar</button>
              </form>

              <div class="social-auth-slot"></div>

              <p class="onboarding__login-link">
                Ainda não tens conta? <a href="#/onboarding">Criar conta →</a>
              </p>

              <div style="text-align:center;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--color-gray-100)">
                <button id="admin-login-btn" style="
                  display:inline-flex;align-items:center;gap:0.5rem;
                  background:transparent;border:1.5px solid var(--color-gray-300);
                  border-radius:var(--radius-full);padding:0.5rem 1.25rem;
                  font-size:0.8rem;font-weight:600;color:var(--color-gray-600);
                  cursor:pointer;transition:all 0.2s;
                ">
                  <i class="icon-lock"></i> Entrar como Admin
                </button>
              </div>
              <div id="admin-credentials-box" style="display:none;margin-top:0.75rem;padding:0.75rem 1rem;background:var(--color-bg-light);border:1px solid var(--color-gray-200);border-radius:var(--radius-md);font-size:0.78rem;color:var(--color-gray-600);text-align:left">
                <div style="font-weight:700;margin-bottom:0.4rem;color:var(--color-gray-700)">Credenciais de Admin</div>
                <div id="admin-creds-display" style="font-family:monospace"></div>
                <button id="admin-fill-btn" style="
                  margin-top:0.6rem;width:100%;padding:0.45rem;
                  background:var(--color-accent-dark);color:#fff;border:none;
                  border-radius:var(--radius-md);font-size:0.8rem;font-weight:600;cursor:pointer;
                ">Preencher e entrar</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    this.bindEvents();
    observeNewElements();
    import("../components/SocialAuthButtons.js").then(m => m.renderSocialAuthButtons(this.container));
  }

  /**
   * Mostra um banner no cartão de login com o botão de reenvio do
   * email de verificação (aparece quando o login falha por 403).
   */
  _showResendVerification() {
    const card = this.container.querySelector(".onboarding__card");
    if (!card || card.querySelector("#resend-verification-banner")) return;

    const banner = document.createElement("div");
    banner.id = "resend-verification-banner";
    banner.className = "resend-verification";
    banner.innerHTML = `
      <p class="resend-verification__title"><span class="icon">${mail}</span> A tua conta ainda não está activa</p>
      <p class="resend-verification__text">
        Enviámos um link de confirmação quando criaste a conta.
        Não chegou nada? Reenvia para o email indicado acima.
      </p>
      <button type="button" id="resend-verification-btn" class="resend-verification__btn">
        Reenviar email de verificação
      </button>
      <p id="resend-verification-status" class="resend-verification__status" style="display:none"></p>
    `;
    card.querySelector(".onboarding__login-link")?.before(banner);
    this._bindResendEvent();
  }

  /** Liga o botão de reenvio (chamado após injectar o banner). */
  _bindResendEvent() {
    const btn = this.container.querySelector("#resend-verification-btn");
    const status = this.container.querySelector("#resend-verification-status");
    const form = this.container.querySelector("#login-form");

    btn?.addEventListener("click", async () => {
      const email = form?.querySelector("#login-email")?.value.trim();
      if (!email) {
        toast.error("Escreve o teu email no campo acima e tenta de novo.");
        return;
      }

      btn.disabled = true;
      btn.textContent = "A reenviar...";

      const result = await requestResend(email);
      status.style.display = "block";
      status.textContent = result.message;
      status.className = `resend-verification__status ${result.ok ? "is-ok" : "is-err"}`;
      toast[result.ok ? "success" : "error"](result.message);

      btn.disabled = false;
      btn.textContent = "Reenviar email de verificação";
    });
  }

  bindEvents() {
    const form = this.container.querySelector("#login-form");
    const submitBtn = this.container.querySelector("#login-submit");

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.querySelector("#login-email").value.trim();
      const palavra_passe = form.querySelector("#login-password").value;

      if (!email || !palavra_passe) {
        toast.error("Preenche todos os campos.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "A entrar...";

      try {
        const res = await api.post("/auth/login", { email, palavra_passe });
        auth.setAuth(res.data.token, res.data.user);

        // Re-monta a navbar para reflectir o estado de login — SEM reload()
        const navbarRoot = document.getElementById("navbar-root");
        if (navbarRoot) {
          new Navbar({ auth, router }).init(navbarRoot);
          // Re-dispara scroll para recalcular efeitos visuais da navbar
          window.dispatchEvent(new Event("scroll"));
        }

        toast.success(
          `Bem-vindo${res.data.user.p_nome ? ", " + res.data.user.p_nome : ""}!`,
        );

        // Navega para admin se for admin, senão para home
        router.navigate(res.data.user.role === "admin" ? "/admin" : "/");
      } catch (err) {
        const isVerificationBlocked =
          err.status === 403 && /confirm|verific/i.test(err.message || "");

        if (isVerificationBlocked) {
          this._showResendVerification(email);
        }

        const message =
          err.status === 404
            ? "Endpoint de login não encontrado. Confirma se o backend está ativo em /api/v1/auth/login."
            : isVerificationBlocked
              ? (err.message || "Confirma o teu email antes de entrar.")
              : err.message || "Email ou palavra-passe incorrectos.";
        toast.error(message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Entrar";
      }
    });

    // Enter no campo de email foca o campo de password
    form?.querySelector("#login-email")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        form.querySelector("#login-password")?.focus();
      }
    });

    // Hint de admin — clique discreto revela nota
    this.container.querySelector("#admin-login-hint")?.addEventListener("click", () => {
      const note = this.container.querySelector("#admin-login-note");
      if (note) note.style.display = note.style.display === "none" ? "block" : "none";
    });

    // Botão "Entrar como Admin" — mostra credenciais e preenche
    const adminBtn  = this.container.querySelector("#admin-login-btn");
    const adminBox  = this.container.querySelector("#admin-credentials-box");
    const adminCreds = this.container.querySelector("#admin-creds-display");
    const adminFill  = this.container.querySelector("#admin-fill-btn");

    const ADMIN_EMAIL = "admin@price360.ao";
    const ADMIN_PASS  = "Admin@123456";

    adminBtn?.addEventListener("click", () => {
      const isOpen = adminBox.style.display !== "none";
      adminBox.style.display = isOpen ? "none" : "block";
      if (!isOpen && adminCreds) {
        adminCreds.innerHTML = `
          <div><span class="icon">${mail}</span> <strong>Email:</strong> ${ADMIN_EMAIL}</div>
          <div><i class="icon-lock"></i> <strong>Password:</strong> ${ADMIN_PASS}</div>
        `;
      }
    });

    adminFill?.addEventListener("click", async () => {
      const emailInput = form.querySelector("#login-email");
      const passInput  = form.querySelector("#login-password");
      if (emailInput) emailInput.value = ADMIN_EMAIL;
      if (passInput)  passInput.value  = ADMIN_PASS;
      adminBox.style.display = "none";
      // Submete automaticamente
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
  }
}