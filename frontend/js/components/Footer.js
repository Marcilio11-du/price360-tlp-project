/**
 * @file components/Footer.js
 * @description Rodapé da aplicação Xé Preço.
 * Colunas: logo + descrição | Categorias (dinâmicas, da API) | Contacto
 */

import { api } from '../api.js';

export class Footer {
  render() {
    return `
      <footer class="footer">
        <div class="footer__inner container">

          <!-- Branding -->
          <div class="footer__brand">
            <div class="footer__logo">
              <span class="footer__logo-text">Xé Preço</span>
            </div>
            <p>Compare preços de produtos essenciais e encontre sempre a melhor oferta.</p>
          </div>

          <!-- Categorias dos produtos (preenchidas dinamicamente) -->
          <div class="footer__categories">
            <h4 class="footer__title">Categorias dos produtos</h4>
            <div class="footer__categories-grid" id="footer-cats-grid">
              <span style="font-size:0.85rem;color:var(--color-gray-400)">A carregar categorias…</span>
            </div>
          </div>

        </div>

        <!-- Linha inferior -->
        <div class="footer__bottom">
          <span class="footer__credits">Anselmo Gomes • Marcílio Domingos • Neil Dias</span>
          <span class="footer__copyright">Xé Preço © ${new Date().getFullYear()}</span>
        </div>
      </footer>
    `;
  }

  /**
   * Carrega as categorias reais da API e distribui-as em colunas.
   * Se falhar, mostra apenas o atalho para /produtos.
   */
  async _loadCategories() {
    const grid = document.getElementById('footer-cats-grid');
    if (!grid) return;

    try {
      const res = await api.get('/categories');
      const cats = (res.data || []).slice().sort((a, b) =>
        String(a.nome).localeCompare(String(b.nome), 'pt'),
      );

      if (!cats.length) throw new Error('vazio');

      // 3 colunas equilibradas com as categorias reais existentes
      const perCol = Math.ceil(cats.length / 3);
      const cols = [0, 1, 2].map((i) => cats.slice(i * perCol, (i + 1) * perCol));

      grid.innerHTML = cols
        .map(
          (col) => `
          <div class="footer__cat-col">
            <ul class="footer__links">
              ${col
                .map(
                  (c) =>
                    `<li><a href="#/produtos?categoria=${c.id}">${c.nome}</a></li>`,
                )
                .join('')}
            </ul>
          </div>`,
        )
        .join('');
    } catch {
      grid.innerHTML = `
        <div class="footer__cat-col">
          <ul class="footer__links">
            <li><a href="#/produtos">Ver todos os produtos →</a></li>
          </ul>
        </div>`;
    }
  }

  init(container) {
    container.innerHTML = this.render();
    this._loadCategories();
  }
}
