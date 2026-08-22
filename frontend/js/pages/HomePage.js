/**
 * @file pages/HomePage.js
 * @description Home reformulada | Xé Preço
 */

import { api }               from '../api.js';
import { toast }             from '../components/Toast.js';
import { auth }              from '../auth.js';
import { router }            from '../router.js';
import { CategoryCard }      from '../components/CategoryCard.js';
import { ProductCard }       from '../components/ProductCard.js';
import { Footer }            from '../components/Footer.js';
import { Loader }            from '../components/Loader.js';
import { modal }             from '../components/Modal.js';
import { PRODUCT_PLACEHOLDER_IMG } from '../utils.js';
import { observeNewElements } from '../animations.js';

export default class HomePage {
  constructor(container) {
    this.container     = container;
    this.categories    = [];
    this.storeProducts = [];
    this.heroInterval  = null;
  }

  async render() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
      this.heroInterval = null;
    }

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
    this._bindHeroCarousel();
    await Promise.all([this._loadCategories(), this._loadProducts()]);
    observeNewElements();
  }

  /* ─── Hero ──────────────────────────────────────────────────── */
  _heroHTML() {
    const slides = [
      { name: 'Computador Portátil', store: 'NCR Angola', price: '1 118 086,92 Kz', tag: 'Melhor preço' },
      { name: 'Laptop premium', store: 'MultiTek', price: '2 076 446,16 Kz', tag: 'Mais barato' },
      { name: 'Laptop profissional', store: 'iTec', price: '1 214 721,30 Kz', tag: 'Promoção' }
    ];

    return `
      <section class="hero" id="hero-section">

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

        <div class="hero__inner">
          <div class="hero__content">
            <span class="hero__eyebrow animate-hero">Comparação de preços em Angola</span>
            <h1 class="hero__title animate-hero">
              Todos os <span class="blue">preços</span>,<br>
              de todas as <span class="orange"><em>lojas</em></span>,<br>
              num só <em>lugar</em>
            </h1>
            <p class="hero__subtitle animate-hero">
              Compare preços reais de tecnologia, casa e supermercado em Angola.
              Crie as suas listas e encontre sempre a melhor oferta.
            </p>
            <div class="hero__actions animate-hero">
              <button class="hero__btn-primary" id="hero-cta">
                Conhecer o Xé Preço
              </button>
              <button class="hero__btn-search" id="hero-search-btn" aria-label="Pesquisar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </div>

            <div class="hero__trust animate-hero" aria-label="Indicadores de confiança">
              <span><strong>10+</strong> produtos reais</span>
              <span><strong>4</strong> lojas ativas</span>
              <span><strong>tempo real</strong></span>
            </div>
          </div>

          <div class="hero__showcase animate-hero" aria-label="Comparação rápida de preços">
            <div class="hero__carousel" aria-live="polite">
              <div class="hero__slides">
                ${slides.map(item => `
                  <article class="hero__slide">
                    <div class="hero__slide-top">
                      <span class="hero__slide-tag">${item.tag}</span>
                      <span class="hero__slide-status">Hoje</span>
                    </div>
                    <div class="hero__slide-main">
                      <div class="hero__product-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M6 8h12l-1 10H7L6 8Z"/>
                          <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
                        </svg>
                      </div>
                      <div>
                        <p class="hero__product-name">${item.name}</p>
                        <small class="hero__product-meta">${item.store} · ${item.price}</small>
                      </div>
                    </div>
                    <div class="hero__price-row">
                      <span>Oferta mais baixa</span>
                      <strong>${item.price}</strong>
                    </div>
                  </article>
                `).join('')}
              </div>
              <div class="hero__dots" aria-label="Mudar item do carrossel">
                ${slides.map((_, idx) => `<button class="hero__dot${idx === 0 ? ' is-active' : ''}" data-index="${idx}" aria-label="Ver slide ${idx + 1}"></button>`).join('')}
              </div>
            </div>

            <div class="hero__mini-panel">
              <div class="hero__mini-chip">+12% barato</div>
              <p>NCR Angola</p>
              <strong>1 118 086,92 Kz</strong>
            </div>
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
            <span class="section-label">O que é o Xé Preço?</span>
            <h2 class="section-title">Compara preços.<br>Poupa <em>dinheiro</em>.</h2>
          </div>

          <div class="about-stats animate-fade">
            <div class="about-stat">
              <strong>10+</strong>
              <span>produtos reais em comparação</span>
            </div>
            <div class="about-stat">
              <strong>4</strong>
              <span>lojas ativas em Angola</span>
            </div>
            <div class="about-stat">
              <strong>Tempo real</strong>
              <span>dados atualizados quando disponíveis</span>
            </div>
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
              <p>Comparamos preços da NCR Angola, Buitanda e muito mais para que tu faças sempre o melhor negócio.</p>
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

          <div class="about-steps animate-fade">
            <div class="about-step">
              <span>01</span>
              <h3>Procura</h3>
              <p>Pesquisa o que precisas num segundo.</p>
            </div>
            <div class="about-step">
              <span>02</span>
              <h3>Compara</h3>
              <p>Vê rapidamente qual a melhor oferta.</p>
            </div>
            <div class="about-step">
              <span>03</span>
              <h3>Compra</h3>
              <p>Economiza sem perder tempo ou qualidade.</p>
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
      const res = await api.get('/store-products/grouped');
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

      this._updateHeroFromProducts(displayed);
      this._bindProductEvents(grid);
      observeNewElements();
    } catch {
      const grid = this.container.querySelector('#home-products-grid');
      if (grid)
        grid.innerHTML = '<p style="grid-column:1/-1;color:var(--color-gray-600)">Erro ao carregar produtos.</p>';
    }
  }

  _resolveProductImage(product) {
    const rawImage = product?.imagem || product?.image || product?.product_image || product?.produto_imagem;
    if (typeof rawImage === 'string' && /^https?:\/\//i.test(rawImage.trim())) {
      return rawImage.trim();
    }
    // Sem imagem real → placeholder neutro (nada de fotos de stock inventadas)
    return PRODUCT_PLACEHOLDER_IMG;
  }

  _updateHeroFromProducts(products = []) {
    const slides = (products || []).slice(0, 3).map((product, index) => {
      const price = Number(product?.preco_min ?? product?.preco ?? 0);
      return {
        name: product?.nome || `Produto ${index + 1}`,
        store: product?.loja_nome || product?.lojas?.[0]?.nome || 'Loja',
        price: Number.isFinite(price) ? new Intl.NumberFormat('pt-AO', {
          style: 'currency', currency: 'AOA', minimumFractionDigits: 2, maximumFractionDigits: 2
        }).format(price) : 'Consulte',
        tag: index === 0 ? 'Melhor preço' : index === 1 ? 'Mais barato' : 'Promoção',
        image: this._resolveProductImage(product)
      };
    });

    const carousel = this.container.querySelector('.hero__carousel');
    const track = this.container.querySelector('.hero__slides');
    if (!carousel || !track) return;

    if (!slides.length) {
      track.innerHTML = '';
      return;
    }

    track.innerHTML = slides.map(item => `
      <article class="hero__slide">
        <div class="hero__slide-top">
          <span class="hero__slide-tag">${item.tag}</span>
          <span class="hero__slide-status">Hoje</span>
        </div>
        <div class="hero__slide-main">
          <div class="hero__product-icon" aria-hidden="true">
            <img src="${item.image}" alt="${item.name}" loading="lazy" />
          </div>
          <div>
            <p class="hero__product-name">${item.name}</p>
            <small class="hero__product-meta">${item.store} · ${item.price}</small>
          </div>
        </div>
        <div class="hero__price-row">
          <span>Oferta mais baixa</span>
          <strong>${item.price}</strong>
        </div>
      </article>
    `).join('');

    const dots = [...this.container.querySelectorAll('.hero__dot')];
    if (dots.length !== slides.length) {
      const dotContainer = this.container.querySelector('.hero__dots');
      if (dotContainer) {
        dotContainer.innerHTML = slides.map((_, idx) => `<button class="hero__dot${idx === 0 ? ' is-active' : ''}" data-index="${idx}" aria-label="Ver slide ${idx + 1}"></button>`).join('');
      }
    }

    this._bindHeroCarousel();
  }

  /* ─── Eventos dos cards de produto ──────────────────────────── */
  _bindProductEvents(grid) {
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
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (!auth.isAuthenticated()) { router.navigate('/login'); return; }
        const sp2 = this.storeProducts.find(p => String(p.id) === btn.dataset.produto);
        const name2 = sp2?.nome || 'Produto';
        import('./ShoppingListPage.js').then(m =>
          m.openAddToListModal(btn.dataset.produto, name2)
        );
      });
    });
  }

  _bindEvents() {
    this.container.querySelector('#hero-cta')?.addEventListener('click', () => {
      this.container
        .querySelector('#conhecer-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    this.container.querySelector('#hero-search-btn')?.addEventListener('click', () => {
      document.querySelector('#navbar-search-input')?.focus();
    });
  }

  _bindHeroCarousel() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
      this.heroInterval = null;
    }

    const carousel = this.container.querySelector('.hero__carousel');
    const track = this.container.querySelector('.hero__slides');
    const dots = this.container.querySelectorAll('.hero__dot');
    if (!carousel || !track || dots.length === 0) return;

    let index = 0;
    const total = dots.length;

    const updateSlide = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
    };

    updateSlide();

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        index = Number(dot.dataset.index || 0);
        updateSlide();
      });
    });

    this.heroInterval = setInterval(() => {
      index = (index + 1) % total;
      updateSlide();
    }, 3200);
  }
}

/* ─── Modal de detalhes do produto (exportado para reutilização) ─ */
export function openProductModal(sp) {
  const available = Number(sp.quantidade ?? 0) > 0;
  const productImage = (typeof sp?.imagem === 'string' && /^https?:\/\//i.test(sp.imagem))
    ? sp.imagem
    : PRODUCT_PLACEHOLDER_IMG;

  const body = `
    <div class="product-modal">
      <div class="product-modal__image-wrap">
        <img
          src="${productImage}"
          alt="${sp.produto_nome}"
          onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER_IMG}'"
          class="product-modal__image"
        />
      </div>

      <div class="product-modal__info">
        <p class="product-modal__store">Vendido por <strong>${sp.loja_nome}</strong></p>
        <p class="product-modal__price">${formatPrice(sp.preco)}</p>

        ${sp.produto_descricao
          ? `<p class="product-modal__desc">${sp.produto_descricao}</p>`
          : ''}

        <span class="product-card__availability product-card__availability--${available ? 'available' : 'unavailable'}">
          ${available ? `Disponível (${sp.quantidade} un.)` : 'Indisponível'}
        </span>
      </div>
    </div>
  `;

  modal.open({
    title: sp.produto_nome,
    body,
    confirmText: 'Adicionar à lista',
    cancelText: 'Fechar',
    size: 'sm',
    onConfirm: async () => {
      if (!auth.isAuthenticated()) {
        modal.close();
        router.navigate('/login');
        return;
      }
      const { openAddToListModal } = await import('./ShoppingListPage.js');
      modal.close();
      openAddToListModal(sp.id_produto, sp.produto_nome || 'Produto');
    }
  });
}

/* helper local — evita import circular */
function formatPrice(preco) {
  if (preco == null) return '—';
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency', currency: 'AOA', minimumFractionDigits: 2
  }).format(preco);
}
