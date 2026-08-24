/**
 * @file pages/FavoritesPage.js
 * @description Página "Os meus Favoritos" (#/favoritos, requer auth).
 * Reutiliza o ProductCard com o coração pré-activado; remover via
 * coração actualiza a lista localmente.
 */

import { api }         from '../api.js';
import { router }      from '../router.js';
import { toast }       from '../components/Toast.js';
import { ProductCard } from '../components/ProductCard.js';
import { Loader }      from '../components/Loader.js';
import { observeNewElements } from '../animations.js';
import { decorateProductCards, invalidateFavoritesCache } from '../components/FavoriteButton.js';

export default class FavoritesPage {
  constructor(container) {
    this.container = container;
    this.favoritos = [];
  }

  async render() {
    this.container.innerHTML = `
      <div class="favorites-page page-wrapper container">
        <div class="products-page__header">
          <h1 class="products-page__title">Os meus Favoritos</h1>
        </div>
        <p class="products-page__count" id="favorites-count"></p>
        <div class="products-page__grid" id="favorites-grid">${Loader.renderSkeleton(4)}</div>
      </div>
    `;

    await this.loadFavorites();
    observeNewElements();
  }

  async loadFavorites() {
    const grid = this.container.querySelector('#favorites-grid');
    try {
      invalidateFavoritesCache();
      const res = await api.get('/favorites');
      this.favoritos = res.data || [];
      this.renderList();
    } catch {
      if (grid) {
        grid.innerHTML = `
          <div class="products-page__empty">
            <div class="empty-icon">!</div>
            <p>Erro ao carregar favoritos.</p>
          </div>`;
      }
    }
  }

  renderList() {
    const grid  = this.container.querySelector('#favorites-grid');
    const count = this.container.querySelector('#favorites-count');
    if (!grid) return;

    if (count) {
      count.textContent = `${this.favoritos.length} favorito${this.favoritos.length !== 1 ? 's' : ''}`;
    }

    if (this.favoritos.length === 0) {
      grid.innerHTML = `
        <div class="products-page__empty" style="grid-column:1/-1;">
          <div class="empty-icon">♥</div>
          <h3>Ainda não tens favoritos</h3>
          <p>Toca no ♥ nos produtos para os guardares aqui.</p>
          <button type="button" class="btn btn--primary" id="fav-go-products">Ver produtos</button>
        </div>`;
      grid.querySelector('#fav-go-products')?.addEventListener('click', () => router.navigate('/produtos'));
      return;
    }

    grid.innerHTML = this.favoritos.map((f) => new ProductCard({
      id: f.id_produto,
      nome: f.nome,
      marca: f.marca,
      descricao: f.descricao,
      preco_min: f.preco_min,
      total_lojas: f.total_lojas,
      quantidade_total: 1,
      imagem: f.imagem,
    }).render()).join('');

    // Clique no card → detalhe
    grid.querySelectorAll('.product-card').forEach((card) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-add') || e.target.closest('.btn-fav')) return;
        router.navigate(`/produto?id=${card.dataset.id}`);
      });
    });

    grid.querySelectorAll('.product-card').forEach((card) => {
      card.querySelector('.btn-add')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const fav = this.favoritos.find((x) => String(x.id_produto) === card.dataset.id);
        import('./ShoppingListPage.js').then((m) =>
          m.openAddToListModal(card.dataset.id, fav?.nome || 'Produto'));
      });
    });

    observeNewElements();

    // Corações pré-activados + remoção em directo
    decorateProductCards(grid).then(() => {
      this.favoritos.forEach((f) => {
        const btn = grid.querySelector(`.btn-fav[data-produto="${f.id_produto}"]`);
        btn?.classList.add('btn-fav--active');
        btn?.addEventListener('click', () => {
          setTimeout(async () => {
            try {
              const check = await api.get('/favorites/ids');
              if (!(check.data || []).includes(f.id_produto)) {
                this.favoritos = this.favoritos.filter((x) => x.id_produto !== f.id_produto);
                this.renderList();
              }
            } catch { /* silencioso */ }
          }, 250);
        });
      });
    });
  }
}
