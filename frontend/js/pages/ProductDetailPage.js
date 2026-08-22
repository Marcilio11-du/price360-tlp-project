import { api } from '../api.js';
import { auth } from '../auth.js';
import { router } from '../router.js';
import { toast } from '../components/Toast.js';
import { PriceSparkline } from '../components/PriceSparkline.js';
import { formatPrice, productImgHtml } from '../utils.js';

const BEST_BADGE = `
  <span class="best-price-badge">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z"/></svg>
    Melhor Preço
  </span>`;

export default class ProductDetailPage {
  constructor(container) { this.container = container; }

  /** Homepage oficial da loja (último recurso se não houver link do produto). */
  getFallbackStoreUrl(storeName = '', storeId = null) {
    const normalizedName = String(storeName || '').trim().toLowerCase();
    const byId = {
      7: 'https://www.ncrangola.com',
      8: 'https://www.buitanda.com',
      9: 'https://www.multitek.ao',
      10: 'https://www.itec.co.ao',
    };
    if (storeId != null && byId[Number(storeId)]) return byId[Number(storeId)];

    const byName = {
      'ncr angola': 'https://www.ncrangola.com',
      'ncr': 'https://www.ncrangola.com',
      'buitanda': 'https://www.buitanda.com',
      'multitek': 'https://www.multitek.ao',
      'itec': 'https://www.itec.co.ao',
    };
    return byName[normalizedName] || null;
  }

  async render() {
    const id = Number(router.getQueryParams().id);
    if (!id) return;

    try {
      const [comparison, history] = await Promise.all([
        api.get(`/products/${id}/compare`),
        api.get(`/products/${id}/historico-precos`),
      ]);
      const { produto, ofertas, estatisticas } = comparison.data;

      // Imagem principal: da melhor oferta (lista já vem ordenada por preço),
      // senão a primeira oferta que tenha imagem.
      const heroImage =
        ofertas.find(o => o.melhor_preco && o.imagem)?.imagem ||
        ofertas.find(o => o.imagem)?.imagem ||
        null;

      this.container.innerHTML = `
        <main class="product-detail page-wrapper container">
          <a href="#/produtos">← Produtos</a>

          <section class="detail-hero">
            <figure class="detail-hero__image">${productImgHtml(heroImage, produto.nome, 'detail-hero__img')}</figure>
            <header class="detail-hero__info">
              <p>${produto.categoria_nome || ''}</p>
              <h1>${produto.nome}</h1>
              <p>${produto.marca || ''}</p>
              ${produto.descricao ? `<p class="detail-hero__desc">${produto.descricao}</p>` : ''}
              ${estatisticas ? `
                <div class="detail-hero__stats">
                  <div><small>Melhor preço</small><strong>${formatPrice(estatisticas.preco_min)}</strong></div>
                  <div><small>Poupança máxima</small><strong>${formatPrice(estatisticas.poupanca_absoluta)}</strong></div>
                  <div><small>Lojas</small><strong>${estatisticas.total_lojas}</strong></div>
                </div>` : '<p>Ainda não há ofertas.</p>'}
            </header>
          </section>

          <section>
            <h2>Ofertas disponíveis</h2>
            <div class="offers">
              ${ofertas.map((o) => this.renderOffer(o, produto)).join('')}
            </div>
          </section>

          <section class="price-history">
            <h2>Histórico de preços</h2>
            ${PriceSparkline({ pontos: history.data?.pontos || [] })}
          </section>

          ${auth.isAuthenticated()
            ? `<form id="price-alert-form" class="price-alert-form">
                <label>Avisa-me quando custar menos de <input name="preco_alvo" type="number" min="1" step="0.01" required> Kzs</label>
                <button class="btn btn--primary">Criar alerta</button>
              </form>`
            : '<p><a href="#/login">Entre</a> para criar um alerta de preço.</p>'}
        </main>`;

      this.bind(produto);
    } catch {
      this.container.innerHTML = '<main class="page-wrapper container">Não foi possível carregar a comparação.</main>';
    }
  }

  renderOffer(o, produto) {
    // Deep-link: URL exacta do produto na loja (guardada pelo scraper)
    const productUrlAttr = o.produto_url
      ? ` data-product-url="${String(o.produto_url).replace(/"/g, '&quot;')}"`
      : '';

    return `
      <article class="offer ${o.melhor_preco ? 'offer--best' : ''}">
        <div class="offer__store">
          <figure class="offer__thumb">${productImgHtml(o.imagem, o.loja_nome, 'offer__thumb-img')}</figure>
          <div>
            <strong>${o.loja_nome}</strong>
            <span>${o.municipio || ''}</span>
          </div>
        </div>
        <div class="offer__price-zone">
          ${o.melhor_preco ? BEST_BADGE : ''}
          <strong>${formatPrice(o.preco)}</strong>
          <span>${o.disponivel ? 'Disponível' : 'Indisponível'}</span>
        </div>
        <div>
          <button class="btn-visit-store" data-id="${o.id_loja}"
                  data-store-name="${(o.loja_nome || '').replace(/"/g, '&quot;')}"${productUrlAttr}>
            Ver na loja
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button class="btn btn--primary btn-add" data-id="${produto.id}" data-name="${produto.nome}" aria-label="Adicionar à lista">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </article>`;
  }

  bind(produto) {
    // "Ver na loja": abre a página DO PRODUTO no site da loja (deep-link),
    // caindo para os links registados da loja e por fim para a homepage.
    this.container.querySelectorAll('.btn-visit-store').forEach(b => b.addEventListener('click', async () => {
      const deepLink = b.dataset.productUrl;

      if (deepLink) {
        window.open(deepLink, '_blank', 'noopener,noreferrer');
        return;
      }

      try {
        const links = (await api.get(`/store-links/store/${b.dataset.id}`)).data || [];
        const fallbackUrl = this.getFallbackStoreUrl(b.dataset.storeName, b.dataset.id);
        const url = links[0]?.link || fallbackUrl;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        else toast.error('Sem website registado para esta loja.');
      } catch {
        const fallbackUrl = this.getFallbackStoreUrl(b.dataset.storeName, b.dataset.id);
        if (fallbackUrl) { window.open(fallbackUrl, '_blank', 'noopener,noreferrer'); return; }
        toast.error('Não foi possível obter o link da loja.');
      }
    }));

    this.container.querySelectorAll('.btn-add').forEach(b => b.addEventListener('click', async () => {
      (await import('./ShoppingListPage.js')).openAddToListModal(b.dataset.id, b.dataset.name);
    }));

    this.container.querySelector('#price-alert-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      try {
        await api.post('/price-alerts', {
          id_produto: produto.id,
          preco_alvo: Number(new FormData(e.target).get('preco_alvo')),
        });
        toast.success('Alerta guardado.');
        e.target.reset();
      } catch {
        toast.error('Não foi possível guardar o alerta.');
      }
    });
  }
}
