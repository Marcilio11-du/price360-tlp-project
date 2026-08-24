import { api }               from '../api.js';
import { auth }              from '../auth.js';
import { router }            from '../router.js';
import { toast }             from '../components/Toast.js';
import { ProductCard }       from '../components/ProductCard.js';
import { Loader }            from '../components/Loader.js';
import { observeNewElements } from '../animations.js';
import { CATALOG_BOOTSTRAP_NOTICE_HTML } from '../utils.js';
import { decorateProductCards } from '../components/FavoriteButton.js';

export default class ProductsPage {
  constructor(container) {
    this.container      = container;
    this.allProducts    = [];
    this.categories     = [];
    this.activeCategory = null;
    this.searchQuery    = '';
    this.sortBy         = 'nome';
  }

  async render() {
    const params = router.getQueryParams();
    this.searchQuery    = params.q || '';
    this.activeCategory = params.categoria ? Number(params.categoria) : null;

    this.container.innerHTML = `
      <div class="products-page page-wrapper container">
        <div class="products-page__header">
          <h1 class="products-page__title">
            ${this.searchQuery
              ? `Resultados para "<em>${this.searchQuery}</em>"`
              : 'Todos os Produtos'}
          </h1>
        </div>
        <div class="products-page__filters" id="category-filters"></div>
        <div class="products-page__toolbar">
          <p class="products-page__count" id="products-count"></p>
          <label class="products-page__sort">
            Ordenar:
            <select id="products-sort">
              <option value="nome">Nome (A–Z)</option>
              <option value="preco-asc">Preço: mais baixo</option>
              <option value="preco-desc">Preço: mais alto</option>
              <option value="poupanca">Maior poupança</option>
              <option value="lojas">Mais lojas</option>
            </select>
          </label>
        </div>
        <div class="products-page__grid" id="products-grid">${Loader.renderSkeleton(8)}</div>
      </div>
    `;

    this.container.querySelector('#products-sort')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderProducts();
    });

    await Promise.all([this.loadCategories(), this.loadProducts()]);
    observeNewElements();
  }

  async loadCategories() {
    try {
      const res = await api.get('/categories');
      this.categories = res.data || [];
      this.renderCategoryFilters();
    } catch { /* ignora */ }
  }

  renderCategoryFilters() {
    const container = this.container.querySelector('#category-filters');
    if (!container) return;
    const chips = [
      `<div class="filter-chip ${!this.activeCategory ? 'filter-chip--active' : ''}" data-id="">Todos</div>`,
      ...this.categories.map(cat => `
        <div class="filter-chip ${this.activeCategory === cat.id ? 'filter-chip--active' : ''}" data-id="${cat.id}">
          ${cat.nome}${cat.totalProdutos != null ? ` <span class="filter-chip__count">${cat.totalProdutos}</span>` : ''}
        </div>
      `)
    ].join('');
    container.innerHTML = chips;
    container.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeCategory = chip.dataset.id ? Number(chip.dataset.id) : null;
        container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
        chip.classList.add('filter-chip--active');
        this.loadProducts();
      });
    });
  }

  async loadProducts() {
    const grid = this.container.querySelector('#products-grid');
    if (grid) grid.innerHTML = Loader.renderSkeleton(8);

    try {
      const params = new URLSearchParams();
      if (this.searchQuery) params.set('q', this.searchQuery);
      if (this.activeCategory) params.set('categoria', this.activeCategory);
      const res = await api.get(`/store-products/grouped?${params}`);
      this.allProducts = res.data || [];
      await this.renderProducts();
    } catch {
      if (grid)
        grid.innerHTML = `
          <div class="products-page__empty">
            <div class="empty-icon">!</div>
            <p>Erro ao carregar produtos. Tenta novamente.</p>
          </div>`;
    }
  }

  async renderProducts() {
    const grid  = this.container.querySelector('#products-grid');
    const count = this.container.querySelector('#products-count');
    if (!grid) return;

    const filtered = this.sortProducts(this.allProducts);

    if (count) {
      count.textContent = `${filtered.length} produto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      // Lista vazia SEM filtros activos pode significar que o catálogo
      // ainda está a ser populado pelos scrapers — verifica antes de
      // mostrar a mensagem genérica de "sem resultados".
      if (!this.searchQuery && !this.activeCategory) {
        try {
          const status = await api.get('/store-products/catalog-status');
          if (status.data?.populado === false) {
            grid.innerHTML = CATALOG_BOOTSTRAP_NOTICE_HTML;
            return;
          }
        } catch { /* segue para o estado normal */ }
      }
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
      .join('');

    // Clique no card → comparação detalhada
    grid.querySelectorAll('.product-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-add')) return;
        const id = Number(card.dataset.id);
        router.navigate(`/produto?id=${id}`);
      });
    });

    // Botão "+" → adicionar à lista
    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!auth.isAuthenticated()) { router.navigate('/login'); return; }
        const sp = this.allProducts.find(p => String(p.id) === btn.dataset.produto);
        const name = sp?.nome || 'Produto';
        import('./ShoppingListPage.js').then(m => m.openAddToListModal(btn.dataset.produto, name));
      });
    });

    observeNewElements();
    decorateProductCards(grid);
  }

  /**
   * Ordenação client-side sobre a lista agrupada de produtos.
   * @param {Array} list
   * @returns {Array} nova lista ordenada
   */
  sortProducts(list) {
    const sorted = [...list];
    switch (this.sortBy) {
      case 'preco-asc':  sorted.sort((a, b) => a.preco_min - b.preco_min); break;
      case 'preco-desc': sorted.sort((a, b) => b.preco_min - a.preco_min); break;
      case 'poupanca':   sorted.sort((a, b) =>
        ((b.preco_max ?? b.preco_min) - b.preco_min) - ((a.preco_max ?? a.preco_min) - a.preco_min)); break;
      case 'lojas':      sorted.sort((a, b) => b.total_lojas - a.total_lojas); break;
      default:           sorted.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt'));
    }
    return sorted;
  }
}
