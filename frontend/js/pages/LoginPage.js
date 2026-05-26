import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { toast } from "../components/Toast.js";
import { Navbar } from "../components/Navbar.js";
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
      <div class="auth-page">
        <div class="auth-card animate-scroll">
          <div class="auth-card__logo">
            <img src="./assets/logo.png" alt="Price360"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
            <div class="navbar__logo-text" style="font-size:1.8rem;justify-content:center;display:none">
              PRICE<span class="logo-360">360</span>
            </div>
          </div>
          <h2 class="auth-card__title">Bem-vindo de <span>volta</span></h2>
          <p style="text-align:center;color:var(--color-gray-600);font-size:0.9rem;margin-bottom:8px">
            Entra na tua conta para gerir as tuas listas de compras
          </p>
          <form class="auth-form" id="login-form" novalidate>
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" placeholder="email@exemplo.com" required autocomplete="email" />
            </div>
            <div class="form-group">
              <label for="login-password">Palavra-passe</label>
              <input type="password" id="login-password" placeholder="A tua palavra-passe" required autocomplete="current-password" />
            </div>
            <button type="submit" class="auth-card__submit" id="login-submit">Entrar</button>
          </form>
          <div class="auth-card__footer">
            Não possui uma conta? <a href="#/onboarding">Criar conta</a>
          </div>
          <div style="text-align:center;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--color-gray-100)">
            <button id="admin-login-btn" style="
              display:inline-flex;align-items:center;gap:0.5rem;
              background:transparent;border:1.5px solid var(--color-gray-300);
              border-radius:var(--radius-full);padding:0.5rem 1.25rem;
              font-size:0.8rem;font-weight:600;color:var(--color-gray-600);
              cursor:pointer;transition:all 0.2s;
            ">
              🔐 Entrar como Admin
            </button>
          </div>
          <div id="admin-credentials-box" style="display:none;margin-top:0.75rem;padding:0.75rem 1rem;background:var(--color-gray-50);border:1px solid var(--color-gray-200);border-radius:var(--radius-md);font-size:0.78rem;color:var(--color-gray-600);text-align:left">
            <div style="font-weight:700;margin-bottom:0.4rem;color:var(--color-gray-700)">Credenciais de Admin</div>
            <div id="admin-creds-display" style="font-family:monospace"></div>
            <button id="admin-fill-btn" style="
              margin-top:0.6rem;width:100%;padding:0.45rem;
              background:var(--color-primary);color:#fff;border:none;
              border-radius:var(--radius-md);font-size:0.8rem;font-weight:600;cursor:pointer;
            ">Preencher e entrar</button>
          </div>
        </div>
      </div>
    `;
    this.bindEvents();
    observeNewElements();
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
        const message =
          err.status === 404
            ? "Endpoint de login não encontrado. Confirma se o backend está ativo em /api/v1/auth/login."
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
          <div>📧 <strong>Email:</strong> ${ADMIN_EMAIL}</div>
          <div>🔐 <strong>Password:</strong> ${ADMIN_PASS}</div>
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