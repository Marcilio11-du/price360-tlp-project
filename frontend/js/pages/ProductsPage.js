import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { ProductCard } from "../components/ProductCard.js";
import { Loader } from "../components/Loader.js";
import { observeNewElements } from "../animations.js";

export default class ProductsPage {
  constructor(container) {
    this.container = container;
    this.allProducts = [];
    this.categories = [];
    this.activeCategory = null;
    this.searchQuery = "";
  }

  async render() {
    const params = router.getQueryParams();
    this.searchQuery = params.q || "";
    this.activeCategory = params.categoria ? Number(params.categoria) : null;

    this.container.innerHTML = `
      <div class="products-page page-wrapper container">
        <div class="products-page__header">
          <h1 class="products-page__title">
            ${
              this.searchQuery
                ? `Resultados para "<em>${this.searchQuery}</em>"`
                : "Todos os Produtos"
            }
          </h1>
        </div>
        <div class="products-page__filters" id="category-filters"></div>
        <p class="products-page__count" id="products-count"></p>
        <div class="products-page__grid" id="products-grid">${Loader.renderSkeleton(8)}</div>
      </div>
    `;

    await Promise.all([this.loadCategories(), this.loadProducts()]);
    observeNewElements();
  }

  async loadCategories() {
    try {
      const res = await api.get("/categories");
      this.categories = res.data || [];
      this.renderCategoryFilters();
    } catch {
      /* ignora */
    }
  }

  renderCategoryFilters() {
    const container = this.container.querySelector("#category-filters");
    if (!container) return;
    const chips = [
      `<div class="filter-chip ${!this.activeCategory ? "filter-chip--active" : ""}" data-id="">Todos</div>`,
      ...this.categories.map(
        (cat) => `
        <div class="filter-chip ${this.activeCategory === cat.id ? "filter-chip--active" : ""}" data-id="${cat.id}">
          ${cat.nome}
        </div>
      `,
      ),
    ].join("");
    container.innerHTML = chips;
    container.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        this.activeCategory = chip.dataset.id ? Number(chip.dataset.id) : null;
        container
          .querySelectorAll(".filter-chip")
          .forEach((c) => c.classList.remove("filter-chip--active"));
        chip.classList.add("filter-chip--active");
        this.loadProducts();
      });
    });
  }

  async loadProducts() {
    const grid = this.container.querySelector("#products-grid");
    if (grid) grid.innerHTML = Loader.renderSkeleton(8);

    try {
      if (this.searchQuery) {
        const productsRes = await api.get(
          `/products?q=${encodeURIComponent(this.searchQuery)}`,
        );
        const productIds = (productsRes.data || []).map((p) => p.id);
        const storeRes = await api.get("/store-products");
        this.allProducts = (storeRes.data || []).filter((sp) =>
          productIds.includes(sp.id_produto),
        );
      } else if (this.activeCategory) {
        const productsRes = await api.get(
          `/products?categoria=${this.activeCategory}`,
        );
        const productIds = (productsRes.data || []).map((p) => p.id);
        const storeRes = await api.get("/store-products");
        this.allProducts = (storeRes.data || []).filter((sp) =>
          productIds.includes(sp.id_produto),
        );
      } else {
        const res = await api.get("/store-products");
        this.allProducts = res.data || [];
      }
      this.renderProducts();
    } catch {
      if (grid)
        grid.innerHTML = `
        <div class="products-page__empty">
          <div class="empty-icon">!</div>
          <p>Erro ao carregar produtos. Tenta novamente.</p>
        </div>`;
    }
  }

  renderProducts() {
    const grid = this.container.querySelector("#products-grid");
    const count = this.container.querySelector("#products-count");
    if (!grid) return;

    const filtered = this.allProducts;

    if (count) {
      count.textContent = `${filtered.length} produto${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="products-page__empty">
          <div class="empty-icon">0</div>
          <h3>Nenhum produto encontrado</h3>
          <p>Tenta pesquisar por outro termo ou categoria.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((sp, i) => new ProductCard(sp, i === 0).render())
      .join("");

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

    observeNewElements();
  }
}
