/**
 * @file pages/HomePage.js
 * @description Home reformulada | Price360
 * — Hero com bolas animadas a descer
 * — Secção Categorias (skeleton → cards)
 * — Secção Produtos Em Alta (skeleton → cards)
 * — Secção "Conhecer o Price360"
 * — Footer conforme protótipo
 */

import { api }               from '../api.js';
import { auth }              from '../auth.js';
import { router }            from '../router.js';
import { CategoryCard }      from '../components/CategoryCard.js';
import { ProductCard }       from '../components/ProductCard.js';
import { Footer }            from '../components/Footer.js';
import { Loader }            from '../components/Loader.js';
import { observeNewElements } from '../animations.js';

export default class HomePage {
  constructor(container) {
    this.container     = container;
    this.categories    = [];
    this.storeProducts = [];
  }

  async render() {
    this.container.innerHTML = `
      <div class="home">

        ${this._heroHTML()}

        <!-- CATEGORIAS -->
        <section class="categories-section">
          <div class="container">
            <div class="section-header animate-fade">
              <span class="section-label">Não sabe o que procura?</span>
              <h2 class="section-title">Procure por <em>categorias</em></h2>
            </div>
            <div class="categories-grid" id="categories-grid">
              ${Loader.renderCategorySkeleton(10)}
            </div>
          </div>
        </section>

        <!-- PRODUTOS EM ALTA -->
        <section class="products-section">
          <div class="container">
            <div class="products-section__header animate-fade">
              <div>
                <span class="section-label">Não sabe o que procura?</span>
                <h2 class="section-title">Produtos <em>Em Alta</em></h2>
              </div>
              <a href="#/produtos" class="view-all">Ver todos →</a>
            </div>
            <div class="products-grid" id="home-products-grid">
              ${Loader.renderSkeleton(8)}
            </div>
          </div>
        </section>

        <!-- CONHECER O PRICE360 -->
        ${this._aboutHTML()}

        <!-- Footer -->
        <div id="footer-root"></div>

      </div>
    `;

    new Footer().init(this.container.querySelector('#footer-root'));
    this._bindEvents();
    await Promise.all([this._loadCategories(), this._loadProducts()]);
    observeNewElements();
  }

  /* ─── Hero ──────────────────────────────────────────────────── */
  _heroHTML() {
    return `
      <section class="hero" id="hero-section">

        <!-- Bolas a descer -->
        <div class="hero__balls" aria-hidden="true">
          <div class="hero__ball"></div>
          <div class="hero__ball"></div>
          <div class="hero__ball"></div>
          <div class="hero__ball"></div>
          <div class="hero__ball"></div>
          <div class="hero__ball"></div>
          <div class="hero__ball"></div>
          <div class="hero__ball"></div>
        </div>

        <div class="hero__content">
          <h1 class="hero__title animate-hero">
            Todos os <span class="blue">preços</span>,<br>
            de todas as <span class="orange"><em>lojas</em></span>,<br>
            num só <em>lugar</em>
          </h1>
          <p class="hero__subtitle animate-hero">
            Compare preços de produtos essenciais no Kero, Shoprite e muito mais.
            Crie as suas listas e encontre sempre a melhor oferta.
          </p>
          <div class="hero__actions animate-hero">
            <button class="hero__btn-primary" id="hero-cta">
              Conhecer o price360
            </button>
            <button class="hero__btn-search" id="hero-search-btn" aria-label="Pesquisar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="hero__scroll" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>
    `;
  }

  /* ─── Secção Conhecer ───────────────────────────────────────── */
  _aboutHTML() {
    return `
      <section class="about-section" id="conhecer-section">
        <div class="container">

          <div class="about-section__header animate-fade">
            <span class="section-label">O que é o Price360?</span>
            <h2 class="section-title">Compara preços.<br>Poupa <em>dinheiro</em>.</h2>
          </div>

          <div class="about-grid">

            <div class="about-card animate-scroll">
              <div class="about-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3>Pesquisa fácil</h3>
              <p>Encontra qualquer produto de uma só vez, em todas as lojas parceiras, sem perder tempo.</p>
            </div>

            <div class="about-card animate-scroll">
              <div class="about-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <h3>Melhor preço sempre</h3>
              <p>Comparamos preços do Kero, Shoprite e muito mais para que tu faças sempre o melhor negócio.</p>
            </div>

            <div class="about-card animate-scroll">
              <div class="about-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
              </div>
              <h3>Listas de compras</h3>
              <p>Cria e gere as tuas listas personalizadas. Partilha com a família e nunca te esqueças de nada.</p>
            </div>

            <div class="about-card animate-scroll">
              <div class="about-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3>Para toda a família</h3>
              <p>Feito para Angola. Produtos do dia-a-dia, marcas que conheces, preços que podes confiar.</p>
            </div>

          </div>

          <div class="about-cta animate-fade">
            <a href="#/onboarding" class="about-cta__btn">
              Criar conta grátis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#/produtos" class="about-cta__link">
              Explorar produtos →
            </a>
          </div>

        </div>
      </section>
    `;
  }

  /* ─── Load Categorias ───────────────────────────────────────── */
  async _loadCategories() {
    try {
      const res = await api.get('/categories');
      this.categories = res.data || [];
      const grid = this.container.querySelector('#categories-grid');
      if (!grid) return;

      if (this.categories.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1;color:var(--color-gray-600);text-align:center;padding:2rem 0">Nenhuma categoria disponível ainda.</p>`;
        return;
      }

      grid.innerHTML = this.categories
        .slice(0, 10)
        .map(cat => new CategoryCard(cat).render())
        .join('');

      grid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () =>
          router.navigate(`/produtos?categoria=${card.dataset.id}`)
        );
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ')
            router.navigate(`/produtos?categoria=${card.dataset.id}`);
        });
      });

      observeNewElements();
    } catch {
      const grid = this.container.querySelector('#categories-grid');
      if (grid)
        grid.innerHTML = '<p style="grid-column:1/-1;color:var(--color-gray-600)">Erro ao carregar categorias.</p>';
    }
  }

  /* ─── Load Produtos ─────────────────────────────────────────── */
  async _loadProducts() {
    try {
      const res = await api.get('/store-products');
      this.storeProducts = res.data || [];
      const grid = this.container.querySelector('#home-products-grid');
      if (!grid) return;

      const displayed = this.storeProducts.slice(0, 8);

      if (displayed.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-gray-600)"><p>Nenhum produto disponível ainda.</p></div>`;
        return;
      }

      grid.innerHTML = displayed
        .map((sp, i) => new ProductCard(sp, i === 0).render())
        .join('');

      this._bindProductEvents(grid);
      observeNewElements();
    } catch {
      const grid = this.container.querySelector('#home-products-grid');
      if (grid)
        grid.innerHTML = '<p style="grid-column:1/-1;color:var(--color-gray-600)">Erro ao carregar produtos.</p>';
    }
  }

  _bindProductEvents(grid) {
    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (!auth.isAuthenticated()) { router.navigate('/login'); return; }
        import('./ShoppingListPage.js').then(m =>
          m.openAddToListModal(btn.dataset.produto)
        );
      });
    });
  }

  _bindEvents() {
    // "Conhecer o price360" → scroll até à secção About
    this.container.querySelector('#hero-cta')?.addEventListener('click', () => {
      this.container
        .querySelector('#conhecer-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Botão lupa → foca search da navbar
    this.container.querySelector('#hero-search-btn')?.addEventListener('click', () => {
      document.querySelector('#navbar-search-input')?.focus();
    });
  }
}
