/**
 * @file components/Navbar.js
 * @description Navbar global persistente da aplicação.
 * Renderiza pesquisa, links de navegação, botões de auth e ícone de carrinho.
 * Suporta dropdown de utilizador com navegação para admin e lista de compras.
 */

import { auth } from "../auth.js";
import { router } from "../router.js";
import { toast } from "./Toast.js";

export class Navbar {
  /**
   * @param {Object} [props={}] - Props opcionais (reservado para extensão futura)
   */
  constructor(props = {}) {
    this.props = props;
  }

  /**
   * Gera o HTML da navbar em função do estado de autenticação.
   * @returns {string}
   */
  render() {
    const user = auth.getUser();
    const isAuth = auth.isAuthenticated();

    // --- Bloco de autenticação ---
    const authButtons = isAuth
      ? `
        <div class="navbar__user" id="navbar-user-menu">
          <div class="navbar__user-avatar">${user?.p_nome?.[0]?.toUpperCase() || "U"}</div>
          <span class="navbar__user-name">${user?.p_nome || "Utilizador"}</span>
          <div class="navbar__user-dropdown" id="user-dropdown" style="display:none">
            ${
              auth.isAdmin()
                ? `<div class="dropdown-item" data-nav="/admin">Dashboard Admin</div>`
                : ""
            }
            <div class="dropdown-item" data-nav="/lista">Listas de Compras</div>
            <div class="dropdown-item dropdown-item--danger" id="logout-btn">Terminar Sessão</div>
          </div>
        </div>
      `
      : `
        <a href="#/login"   class="btn btn--outline">Login</a>
        <a href="#/cadastro" class="btn btn--primary">Sign in</a>
      `;

    return `
      <nav class="navbar">
        <div class="navbar__inner container">

          <!-- Logo -->
          <a href="#/" class="navbar__logo">
            <img src="./assets/logo.png" alt="Price360" onerror="this.style.display='none'">
            <span class="navbar__logo-text"></span>
          </a>

          <!-- Pesquisa -->
          <div class="navbar__search">
            <input
              type="text"
              id="navbar-search-input"
              class="navbar__search-input"
              placeholder="Pesquise por produtos ou marca ..."
              autocomplete="off"
              aria-label="Pesquisar produtos"
            />
            <button class="navbar__search-btn" id="navbar-search-btn" aria-label="Pesquisar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>

          <!-- Links principais -->
          <nav class="navbar__nav" aria-label="Navegação principal">
            <a href="#/">Home</a>
            <a href="#/produtos">Produtos</a>
          </nav>

          <!-- Acções de auth + carrinho -->
          <div class="navbar__actions">
            ${authButtons}

            <button class="navbar__cart btn btn--icon" id="navbar-cart" aria-label="Lista de compras">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </button>
          </div>

        </div>
      </nav>
    `;
  }

  /**
   * Associa todos os event listeners depois de o HTML estar no DOM.
   * @param {HTMLElement} container - Elemento onde a navbar foi injectada
   */
  bindEvents(container) {
    // --- Pesquisa ---
    const searchInput = container.querySelector("#navbar-search-input");
    const searchBtn = container.querySelector("#navbar-search-btn");

    const doSearch = () => {
      const q = searchInput?.value.trim();
      if (q) {
        router.navigate(`/produtos?q=${encodeURIComponent(q)}`);
      } else {
        toast.info("Introduz um termo de pesquisa.");
      }
    };

    searchBtn?.addEventListener("click", doSearch);
    searchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSearch();
      if (e.key === "Escape") searchInput.value = "";
    });

    // --- Dropdown de utilizador ---
    const userMenu = container.querySelector("#navbar-user-menu");
    const dropdown = container.querySelector("#user-dropdown");

    userMenu?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dropdown) {
        dropdown.style.display =
          dropdown.style.display === "none" ? "block" : "none";
      }
    });

    // Fecha dropdown ao clicar fora
    document.addEventListener("click", () => {
      if (dropdown) dropdown.style.display = "none";
    });

    // --- Itens de navegação no dropdown ---
    container.querySelectorAll(".dropdown-item[data-nav]").forEach((item) => {
      item.addEventListener("click", () => router.navigate(item.dataset.nav));
    });

    // --- Estado ativo dos links ---
    const currentPath = router.getCurrentPath();
    container.querySelectorAll(".navbar__nav a").forEach((link) => {
      const target = link.getAttribute("href")?.replace(/^#/, "") || "";
      if (target === currentPath) {
        link.classList.add("active");
      }
    });

    // --- Logout ---
    container.querySelector("#logout-btn")?.addEventListener("click", () => {
      auth.logout();
    });

    // --- Ícone de carrinho ---
    container.querySelector("#navbar-cart")?.addEventListener("click", () => {
      if (auth.isAuthenticated()) {
        router.navigate("/lista");
      } else {
        toast.info("Faz login para aceder à tua lista de compras.");
        router.navigate("/login");
      }
    });
  }

  /**
   * Inicializa a navbar: injeta HTML e associa eventos.
   * @param {HTMLElement} container - Elemento raiz onde a navbar deve ser montada
   */
  init(container) {
    container.innerHTML = this.render();
    this.bindEvents(container);
  }
}
