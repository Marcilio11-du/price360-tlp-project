import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { CategoryCard } from "../components/CategoryCard.js";
import { ProductCard } from "../components/ProductCard.js";
import { Footer } from "../components/Footer.js";
import { Loader } from "../components/Loader.js";
import { observeNewElements } from "../animations.js";

export default class HomePage {
  constructor(container) {
    this.container = container;
    this.categories = [];
    this.storeProducts = [];
  }

  async render() {
    this.container.innerHTML = `
      <div class="home">

        ${this.heroHTML()}

        <div class="container">

          <!-- CATEGORIAS -->
          <section class="categories-section">
            <div class="section-header animate-fade">
              <span class="section-label">Não sabe o que procura?</span>
              <h2 class="section-title">Procure por <em>categorias</em></h2>
            </div>
            <div class="categories-grid" id="categories-grid">
              <div style="grid-column:1/-1">${Loader.render()}</div>
            </div>
          </section>

          <!-- PRODUTOS EM DESTAQUE -->
          <section class="products-section">
            <div class="products-section__header animate-fade">
              <div>
                <h2>Melhores <span style="color:var(--color-secondary)">preços</span> disponíveis</h2>
                <p style="color:var(--color-gray-600);font-size:0.875rem;margin-top:4px">
                  Produtos ordenados do mais barato ao mais caro
                </p>
              </div>
              <a href="#/produtos" class="view-all">Ver todos →</a>
            </div>
            <div class="products-grid" id="home-products-grid">
              ${Loader.renderSkeleton(4)}
            </div>
          </section>

        </div>

        <!-- CTA Banner -->
        <div class="home-cta animate-fade">
          <h2>Poupa tempo e dinheiro</h2>
          <p>Compara preços de centenas de produtos em múltiplas lojas e faz sempre o melhor negócio.</p>
          <a href="#/cadastro" class="btn btn--primary" style="font-size:1rem;padding:0.875rem 2rem">
            Criar conta grátis
          </a>
        </div>

      </div>
    `;

    // Footer
    const footerEl = document.createElement("div");
    this.container.querySelector(".home").appendChild(footerEl);
    new Footer().init(footerEl);

    this.bindEvents();
    await Promise.all([this.loadCategories(), this.loadProducts()]);
    observeNewElements();
  }

  heroHTML() {
    return `
      <section class="hero">
        <div class="hero__content animate-fade">
          <h1 class="hero__title">
            Todos os <span class="blue">preços</span>,<br>
            de todas as <span class="orange"><em>lojas</em></span>,<br>
            num só <em>lugar</em>
          </h1>
          <p class="hero__subtitle">
            Compare preços de produtos essenciais no Kero, Shoprite e muito mais.
            Crie as suas listas e encontre sempre a melhor oferta.
          </p>
          <div class="hero__actions">
            <button class="hero__btn-primary" id="hero-cta">
              Conhecer o price360
            </button>
            <button class="hero__btn-search" id="hero-search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Pesquisar
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="hero__stats">
          <div class="hero__stat animate-scroll">
            <span class="hero__stat-value" id="stat-products">—</span>
            <span class="hero__stat-label">Produtos</span>
          </div>
          <div class="hero__stat animate-scroll">
            <span class="hero__stat-value" id="stat-stores">—</span>
            <span class="hero__stat-label">Lojas</span>
          </div>
          <div class="hero__stat animate-scroll">
            <span class="hero__stat-value" id="stat-categories">—</span>
            <span class="hero__stat-label">Categorias</span>
          </div>
        </div>

        <!-- Scroll indicator -->
        <div class="hero__scroll">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>
    `;
  }

  async loadCategories() {
    try {
      const res = await api.get("/categories");
      this.categories = res.data || [];
      const grid = this.container.querySelector("#categories-grid");
      if (!grid) return;

      if (this.categories.length === 0) {
        grid.innerHTML = `
          <p style="grid-column:1/-1;color:var(--color-gray-600);text-align:center;padding:2rem 0">
            Nenhuma categoria disponível ainda.
          </p>`;
        return;
      }

      grid.innerHTML = this.categories
        .slice(0, 10)
        .map((cat) => new CategoryCard(cat).render())
        .join("");

      grid.querySelectorAll(".category-card").forEach((card) => {
        card.addEventListener("click", () =>
          router.navigate(`/produtos?categoria=${card.dataset.id}`),
        );
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ")
            router.navigate(`/produtos?categoria=${card.dataset.id}`);
        });
      });

      // Actualiza stat de categorias
      const statEl = this.container.querySelector("#stat-categories");
      if (statEl) statEl.textContent = this.categories.length + "+";
    } catch {
      const grid = this.container.querySelector("#categories-grid");
      if (grid)
        grid.innerHTML =
          '<p style="grid-column:1/-1;color:var(--color-gray-600)">Erro ao carregar categorias.</p>';
    }
  }

  async loadProducts() {
    try {
      const res = await api.get("/store-products");
      this.storeProducts = res.data || [];
      const grid = this.container.querySelector("#home-products-grid");
      if (!grid) return;

      const displayed = this.storeProducts.slice(0, 8);

      if (displayed.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-gray-600)">
            <div style="font-size:2.25rem;margin-bottom:1rem;font-weight:800;color:var(--color-primary)">0</div>
            <p>Nenhum produto disponível ainda.</p>
            <p style="font-size:0.875rem;margin-top:8px">Adiciona produtos através do painel de administração.</p>
          </div>`;
        return;
      }

      grid.innerHTML = displayed
        .map((sp, i) => new ProductCard(sp, i === 0).render())
        .join("");

      // Actualiza stats
      const statProducts = this.container.querySelector("#stat-products");
      const statStores = this.container.querySelector("#stat-stores");
      if (statProducts)
        statProducts.textContent = this.storeProducts.length + "+";
      if (statStores) {
        const uniqueStores = new Set(this.storeProducts.map((sp) => sp.id_loja))
          .size;
        statStores.textContent = uniqueStores + "+";
      }

      this.bindProductEvents(grid);
    } catch {
      const grid = this.container.querySelector("#home-products-grid");
      if (grid)
        grid.innerHTML =
          '<p style="grid-column:1/-1;color:var(--color-gray-600)">Erro ao carregar produtos.</p>';
    }
  }

  bindProductEvents(grid) {
    grid.querySelectorAll(".btn-add").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!auth.isAuthenticated()) {
          router.navigate("/login");
          return;
        }
        import("./ShoppingListPage.js").then((m) =>
          m.openAddToListModal(btn.dataset.produto),
        );
      });
    });
  }

  bindEvents() {
    this.container.querySelector("#hero-cta")?.addEventListener("click", () => {
      this.container
        .querySelector(".categories-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    this.container
      .querySelector("#hero-search-btn")
      ?.addEventListener("click", () => {
        document.querySelector("#navbar-search-input")?.focus();
      });
  }
}
