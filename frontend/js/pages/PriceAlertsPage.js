import { api } from '../api.js'; import { toast } from '../components/Toast.js'; import { formatPrice } from '../utils.js'; import { router } from '../router.js';
export default class PriceAlertsPage {
  constructor(container) { this.container = container; }

  async render() {
    let alerts = [];
    let loadError = false;
    try {
      alerts = (await api.get('/price-alerts')).data || [];
    } catch { loadError = true; }

    const ativos = alerts.filter(a => !a.atingido).length;

    this.container.innerHTML = `
      <main class="page-wrapper container">
        <div class="alerts-page">
          <div class="alerts-page__header">
            <div>
              <h1 class="alerts-page__title">Alertas de preço</h1>
              <p class="alerts-page__subtitle">Avisamos-te quando os produtos baixarem de preço.</p>
            </div>
            ${alerts.length ? `<span class="alerts-page__count">${ativos} activo${ativos === 1 ? '' : 's'} de ${alerts.length}</span>` : ''}
          </div>

          ${loadError
            ? '<p>Não foi possível carregar os alertas.</p>'
            : alerts.length
              ? `<div class="alerts-list">
                  ${alerts.map(a => this.renderAlert(a)).join('')}
                </div>`
              : this.renderEmpty()}
        </div>
      </main>
    `;

    this.container.querySelectorAll('.alert-card__remove').forEach(b => {
      b.addEventListener('click', async () => {
        b.disabled = true;
        try {
          await api.delete(`/price-alerts/${b.dataset.id}`);
          toast.success('Alerta removido.');
          this.render();
        } catch {
          toast.error('Não foi possível remover o alerta.');
          b.disabled = false;
        }
      });
    });

    this.container.querySelector('#alerts-explore-btn')
      ?.addEventListener('click', () => router.navigate('/produtos'));
  }

  renderAlert(a) {
    // Progresso até à meta (quando há preço actual conhecido)
    let progressHtml = '';
    if (a.preco_atual != null && a.preco_alvo > 0) {
      const pct = Math.max(4, Math.min(100, Math.round((a.preco_alvo / a.preco_atual) * 100)));
      progressHtml = `
        <div class="alert-card__progress" aria-hidden="true">
          <div class="alert-card__progress-bar" style="width:${a.atingido ? 100 : pct}%"></div>
        </div>`;
    }

    return `
      <article class="alert-card">
        <div class="alert-card__info">
          <div class="alert-card__name">${a.produto_nome}</div>
          <div class="alert-card__meta">
            <span>Alvo: <strong>${formatPrice(a.preco_alvo)}</strong></span>
            <span>Actual: ${a.preco_atual == null ? '—' : formatPrice(a.preco_atual)}</span>
          </div>
          ${progressHtml}
        </div>
        <span class="alert-badge ${a.atingido ? 'alert-badge--hit' : 'alert-badge--wait'}">
          ${a.atingido
            ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Atingido'
            : 'Em espera'}
        </span>
        <button class="alert-card__remove" data-id="${a.id}">Remover</button>
      </article>
    `;
  }

  renderEmpty() {
    return `
      <div class="alerts-empty">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          <line x1="3" y1="3" x2="21" y2="21" opacity="0.35"/>
        </svg>
        <h2>Ainda não tens alertas</h2>
        <p>Abre um produto e define o preço alvo — avisamos-te por email quando alguma loja baixar.</p>
        <button type="button" class="btn btn--primary" id="alerts-explore-btn">Explorar produtos</button>
      </div>
    `;
  }
}
