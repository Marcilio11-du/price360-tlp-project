import { api } from '../api.js'; import { toast } from '../components/Toast.js'; import { formatPrice } from '../utils.js';
export default class PriceAlertsPage {
  constructor(container) { this.container = container; }

  async render() {
    try {
      const alerts = (await api.get('/price-alerts')).data || [];

      this.container.innerHTML = `
        <main class="page-wrapper container">
          <h1>Alertas de preço</h1>
          ${alerts.length
            ? alerts.map(a => `
              <article class="offer">
                <div>
                  <strong>${a.produto_nome}</strong>
                  <span>Alvo: ${formatPrice(a.preco_alvo)} · Atual: ${a.preco_atual == null ? '—' : formatPrice(a.preco_atual)}</span>
                </div>
                <span class="${a.atingido ? 'best-price-badge' : 'status-pill'}">
                  ${a.atingido ? 'Atingido' : 'Em espera'}
                </span>
                <button class="delete-alert btn btn--outline" data-id="${a.id}">Remover</button>
              </article>
            `).join('')
            : '<p>Ainda não tem alertas.</p>'}
        </main>
      `;

      this.container.querySelectorAll('.delete-alert').forEach(b => {
        b.addEventListener('click', async () => {
          try {
            await api.delete(`/price-alerts/${b.dataset.id}`);
            toast.success('Alerta removido.');
            this.render();
          } catch {
            toast.error('Não foi possível remover o alerta.');
          }
        });
      });
    } catch {
      this.container.innerHTML = '<main class="page-wrapper container">Não foi possível carregar os alertas.</main>';
    }
  }
}
