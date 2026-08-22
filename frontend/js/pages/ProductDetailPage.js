import { api } from '../api.js'; import { auth } from '../auth.js'; import { router } from '../router.js'; import { toast } from '../components/Toast.js'; import { PriceSparkline } from '../components/PriceSparkline.js'; import { formatPrice } from '../utils.js';
export default class ProductDetailPage {
  constructor(container) { this.container = container; }

  getFallbackStoreUrl(storeName = '', storeId = null) {
    const normalizedName = String(storeName || '').trim().toLowerCase();
    const byId = {
      7: 'https://www.ncrangola.com',
      8: 'https://www.buitanda.com',
      9: 'https://www.multitek.ao',
      10: 'https://itec.co.ao',
    };

    if (storeId != null && byId[Number(storeId)]) return byId[Number(storeId)];

    const byName = {
      'ncr angola': 'https://www.ncrangola.com',
      'ncr': 'https://www.ncrangola.com',
      'buitanda': 'https://www.buitanda.com',
      'multitek': 'https://www.multitek.ao',
      'itec': 'https://itec.co.ao',
      'kero': 'https://kero.ao',
      'shoprite': 'https://www.shoprite.co.ao',
      'zap': 'https://www.zap.co.ao',
      'eka market': 'https://ekamarket.ao',
      'bom preço': 'https://www.bompreco.ao',
    };

    return byName[normalizedName] || null;
  }

  async render() { const id = Number(router.getQueryParams().id); if (!id) return; try { const [comparison, history] = await Promise.all([api.get(`/products/${id}/compare`), api.get(`/products/${id}/historico-precos`)]); const { produto, ofertas, estatisticas } = comparison.data; this.container.innerHTML = `<main class="product-detail page-wrapper container"><a href="#/produtos">← Produtos</a><header><p>${produto.categoria_nome || ''}</p><h1>${produto.nome}</h1><p>${produto.marca || ''}</p><p>${produto.descricao || ''}</p></header>${estatisticas ? `<section class="detail-stats"><div><small>Melhor preço</small><strong>${formatPrice(estatisticas.preco_min)}</strong></div><div><small>Poupança máxima</small><strong>${formatPrice(estatisticas.poupanca_absoluta)} (${estatisticas.poupanca_percentual.toFixed(1)}%)</strong></div><div><small>Lojas</small><strong>${estatisticas.total_lojas}</strong></div></section>` : '<p>Ainda não há ofertas.</p>'}<section><h2>Ofertas disponíveis</h2><div class="offers">${ofertas.map(o => `<article class="offer ${o.melhor_preco ? 'offer--best' : ''}"><div><strong>${o.loja_nome}</strong><span>${o.municipio || ''}</span></div><div>${o.melhor_preco ? '<span class="best-price-badge">Melhor Preço</span>' : ''}<strong>${formatPrice(o.preco)}</strong><span>${o.disponivel ? 'Disponível' : 'Indisponível'}</span></div><div><button class="btn-visit-store" data-id="${o.id_loja}" data-store-name="${(o.loja_nome || '').replace(/"/g, '&quot;')}">Visitar loja</button><button class="btn btn--primary btn-add" data-id="${produto.id}" data-name="${produto.nome}" aria-label="Adicionar à lista"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div></article>`).join('')}</div></section><section class="price-history"><h2>Histórico de preços</h2>${PriceSparkline({ pontos: history.data?.pontos || [] })}</section>${auth.isAuthenticated() ? '<form id="price-alert-form" class="price-alert-form"><label>Avisa-me quando custar menos de <input name="preco_alvo" type="number" min="1" step="0.01" required> Kzs</label><button class="btn btn--primary">Criar alerta</button></form>' : '<p><a href="#/login">Entre</a> para criar um alerta de preço.</p>'}</main>`; this.bind(produto); } catch { this.container.innerHTML = '<main class="page-wrapper container">Não foi possível carregar a comparação.</main>'; } }
  bind(produto) { this.container.querySelectorAll('.btn-visit-store').forEach(b => b.addEventListener('click', async () => { try { const links = (await api.get(`/store-links/store/${b.dataset.id}`)).data || []; const fallbackUrl = this.getFallbackStoreUrl(b.dataset.storeName, b.dataset.id); const url = links[0]?.link || fallbackUrl; if (url) window.open(url, '_blank', 'noopener,noreferrer'); else toast.error('Sem website registado para esta loja.'); } catch { const fallbackUrl = this.getFallbackStoreUrl(b.dataset.storeName, b.dataset.id); if (fallbackUrl) { window.open(fallbackUrl, '_blank', 'noopener,noreferrer'); return; } toast.error('Não foi possível obter o link da loja.'); } })); this.container.querySelectorAll('.btn-add').forEach(b => b.addEventListener('click', async () => (await import('./ShoppingListPage.js')).openAddToListModal(b.dataset.id, b.dataset.name))); this.container.querySelector('#price-alert-form')?.addEventListener('submit', async e => { e.preventDefault(); try { await api.post('/price-alerts', { id_produto: produto.id, preco_alvo: Number(new FormData(e.target).get('preco_alvo')) }); toast.success('Alerta guardado.'); e.target.reset(); } catch { toast.error('Não foi possível guardar o alerta.'); } }); }
}
