import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { toast } from "../components/Toast.js";
import { observeNewElements } from "../animations.js";

export default class RegisterPage {
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
        <div class="auth-card animate-scroll" style="max-width:540px">
          <div class="auth-card__logo">
            <div class="navbar__logo-text" style="font-size:1.5rem;text-align:center">
              PRICE<span style="color:var(--color-secondary)">360</span>
            </div>
          </div>
          <h2 class="auth-card__title">Criar <span>conta</span></h2>
          <form class="auth-form" id="register-form" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label for="reg-pnome">Primeiro nome</label>
                <input type="text" id="reg-pnome" placeholder="Ana" required />
              </div>
              <div class="form-group">
                <label for="reg-unome">Último nome</label>
                <input type="text" id="reg-unome" placeholder="Silva" required />
              </div>
            </div>
            <div class="form-group">
              <label for="reg-email">Email</label>
              <input type="email" id="reg-email" placeholder="email@exemplo.com" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="reg-pass">Palavra-passe</label>
                <input type="password" id="reg-pass" placeholder="Mínimo 8 caracteres" required />
              </div>
              <div class="form-group">
                <label for="reg-pass2">Confirmar</label>
                <input type="password" id="reg-pass2" placeholder="Repetir palavra-passe" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="reg-nascimento">Data de nascimento</label>
                <input type="date" id="reg-nascimento" required />
              </div>
              <div class="form-group">
                <label for="reg-genero">Género</label>
                <select id="reg-genero" required>
                  <option value="">Seleccionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="reg-rua">Rua / Endereço</label>
              <input type="text" id="reg-rua" placeholder="Rua das Flores, 123" required />
            </div>
            <div class="form-group">
              <label for="reg-municipio">Município</label>
              <input type="text" id="reg-municipio" placeholder="Luanda" required />
            </div>
            <button type="submit" class="auth-card__submit btn btn--primary" id="register-submit">
              Criar conta
            </button>
          </form>
          <div class="auth-card__footer">
            Já tem conta? <a href="#/login">Entrar</a>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    observeNewElements();
  }

  bindEvents() {
    const form = this.container.querySelector("#register-form");
    const submitBtn = this.container.querySelector("#register-submit");

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const p_nome = form.querySelector("#reg-pnome").value.trim();
      const u_nome = form.querySelector("#reg-unome").value.trim();
      const email = form.querySelector("#reg-email").value.trim();
      const palavra_passe = form.querySelector("#reg-pass").value;
      const confirmPass = form.querySelector("#reg-pass2").value;
      const data_nascimento = form.querySelector("#reg-nascimento").value;
      const genero = form.querySelector("#reg-genero").value;
      const rua = form.querySelector("#reg-rua").value.trim();
      const municipio = form.querySelector("#reg-municipio").value.trim();

      if (
        !p_nome ||
        !u_nome ||
        !email ||
        !palavra_passe ||
        !data_nascimento ||
        !genero ||
        !rua ||
        !municipio
      ) {
        toast.error("Preenche todos os campos obrigatórios.");
        return;
      }
      if (palavra_passe !== confirmPass) {
        toast.error("As palavras-passe não coincidem.");
        return;
      }
      if (palavra_passe.length < 8) {
        toast.error("A palavra-passe deve ter pelo menos 8 caracteres.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "A criar conta...";

      try {
        await api.post("/users", {
          p_nome,
          u_nome,
          email,
          palavra_passe,
          data_nascimento,
          genero,
          rua,
          municipio,
        });
        toast.success("Conta criada com sucesso! Podes fazer login agora.");
        setTimeout(() => router.navigate("/login"), 1500);
      } catch (err) {
        const msg = err.details?.[0] || err.message || "Erro ao criar conta.";
        toast.error(msg);
        submitBtn.disabled = false;
        submitBtn.textContent = "Criar conta";
      }
    });
  }
}
