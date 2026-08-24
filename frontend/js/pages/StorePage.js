/**
 * @file pages/StorePage.js
 * @description Página pública de perfil de loja (#/loja?id=X).
 * Mostra dados, contactos, website e os produtos disponíveis
 * na loja com preço directo.
 */

import { api }         from '../api.js';
import { auth }        from '../auth.js';
import { router }      from '../router.js';
import { toast }       from '../components/Toast.js';
import { ProductCard } from '../components/ProductCard.js';
import { Loader }      from '../components/Loader.js';
import { observeNewElements } from '../animations.js';
import { mail, phone, globe, pin, trash, star, starsHtml as iconsStarsHtml } from '../components/icons.js';

export default class StorePage {
  constructor(container) {
    this.container = container;
    this.loja = null;
    this.produtos = [];
  }

  async render() {
    const params = router.getQueryParams();
    this.storeId = Number(params.id);

    this.container.innerHTML = `
      <div class="store-page page-wrapper container">
        <div id="store-content">${Loader.renderSpinner()}</div>
      </div>
    `;

    if (!this.storeId) {
      this.renderError('Loja não especificada.');
      return;
    }

    try {
      const [profileRes, productsRes, reviewsRes] = await Promise.all([
        api.get(`/stores/${this.storeId}/profile`),
        api.get(`/stores/${this.storeId}/products`),
        api.get(`/stores/${this.storeId}/reviews`),
      ]);
      this.loja     = profileRes.data;
      this.produtos = productsRes.data || [];
      this.reviews  = reviewsRes.data || { avaliacoes: [], estatisticas: { media: null, total: 0 } };
      this.renderStore();
    } catch (err) {
      this.renderError(err.status === 404 ? 'Loja não encontrada.' : 'Erro ao carregar a loja.');
    }
  }

  /**
   * Linha de estrelas (SVG) a partir de uma média 0–5.
   */
  static starsHtml(media) {
    if (media == null) return '<span class="store-reviews__nostars">Sem avaliações</span>';
    return `
      <span class="store-reviews__stars">${iconsStarsHtml(media)}</span>
      <span class="store-reviews__media">${media.toFixed(1)}</span>`;
  }

  renderError(message) {
    const el = this.container.querySelector('#store-content');
    if (!el) return;
    el.innerHTML = `
      <div class="products-page__empty">
        <div class="empty-icon">!</div>
        <h3>${message}</h3>
        <p><a href="#/produtos" style="color:var(--color-accent-dark);font-weight:700;">Ver todos os produtos</a></p>
      </div>`;
  }

  renderStore() {
    const el = this.container.querySelector('#store-content');
    if (!el || !this.loja) return;

    const { nome, municipio, endereco, email, telefones = [], links = [], totalProdutos = 0 } = this.loja;
    const website = links.find(l => l.url || l.link) || null;
    const websiteUrl = website ? (website.url || website.link) : null;

    el.innerHTML = `
      <nav class="store-page__breadcrumb">
        <a href="#/">Início</a><span>›</span><span>Lojas</span><span>›</span><strong>${nome}</strong>
      </nav>

      <header class="store-page__header animate-scroll">
        <div class="store-page__avatar" aria-hidden="true">${(nome || '?')[0].toUpperCase()}</div>
        <div class="store-page__info">
          <h1>${nome}</h1>
          <p class="store-page__location"><span class="icon">${pin}</span> ${municipio}${endereco ? ` · ${endereco}` : ''}</p>
          <div class="store-page__contacts">
            ${email ? `<span><span class="icon">${mail}</span> ${email}</span>` : ''}
            ${telefones.slice(0, 2).map(t => `<span><span class="icon">${phone}</span> ${t.n_telefone || t.telefone || t}</span>`).join('')}
            ${websiteUrl ? `<a href="${websiteUrl}" target="_blank" rel="noopener noreferrer"><span class="icon">${globe}</span> Website</a>` : ''}
          </div>
        </div>
        <div class="store-page__stats">
          <strong>${totalProdutos}</strong>
          <span>produto${totalProdutos !== 1 ? 's' : ''} disponíve${totalProdutos !== 1 ? 'is' : 'l'}</span>
        </div>
      </header>

      <h2 class="store-page__subtitle">Produtos nesta loja</h2>
      <div class="products-page__grid" id="store-products-grid"></div>

      <section class="store-reviews" id="store-reviews-section">
        <h2 class="store-page__subtitle">Avaliações ${this.reviews.estatisticas?.total ? `(${this.reviews.estatisticas.total})` : ''}</h2>
        <div class="store-reviews__summary">
          ${StorePage.starsHtml(this.reviews.estatisticas?.media ?? null)}
          <button type="button" class="btn btn--outline" id="btn-open-review">${auth.isAuthenticated() ? 'Avaliar esta loja' : 'Entra para avaliar'}</button>
        </div>
        <form class="store-reviews__form" id="review-form" hidden>
          <fieldset class="store-reviews__nota">
            <legend>A tua nota:</legend>
            ${[5, 4, 3, 2, 1].map(n => `
              <label><input type="radio" name="nota" value="${n}" required> ${n} <span class="star-inline">${star}</span></label>
            `).join('')}
          </fieldset>
          <textarea name="comentario" maxlength="500" rows="3"
            placeholder="Conta a tua experiência (opcional, máx. 500 caracteres)"></textarea>
          <div class="store-reviews__form-actions">
            <button type="submit" class="btn btn--primary">Publicar avaliação</button>
            <button type="button" class="btn btn--outline" id="btn-cancel-review">Cancelar</button>
          </div>
        </form>
        <ul class="store-reviews__list" id="reviews-list"></ul>
      </section>
    `;

    this.renderProducts();
    this.renderReviews();
    this.bindReviewForm();
    observeNewElements();
  }

  renderReviews() {
    const list = this.container.querySelector('#reviews-list');
    if (!list) return;

    const minhas = this.reviews.avaliacoes.filter(a => auth.isAuthenticated() && a.id_utilizador === this.currentUserId());
    const items = this.reviews.avaliacoes.map(av => `
      <li class="store-review animate-scroll" data-id="${av.id}">
        <div class="store-review__head">
          <strong>${av.utilizador_nome}</strong>
          <span class="store-review__stars">${iconsStarsHtml(av.nota)}</span>
          <time>${new Date(av.created_at).toLocaleDateString('pt-PT')}</time>
          ${this._canDelete(av) ? `<button type="button" class="store-review__delete" data-id="${av.id}" aria-label="Remover avaliação"><span class="icon">${trash}</span></button>` : ''}
        </div>
        ${av.comentario ? `<p>${av.comentario}</p>` : ''}
      </li>`).join('');

    list.innerHTML = items || '<li class="store-reviews__empty">Ainda sem avaliações. Sê o primeiro!</li>';

    list.querySelectorAll('.store-review__delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.delete(`/stores/${this.storeId}/reviews/${btn.dataset.id}`);
          toast.success('Avaliação removida.');
          await this.reloadReviews();
        } catch (err) {
          toast.error(err.status === 403 ? 'Sem permissão.' : 'Não foi possível remover.');
        }
      });
    });
  }

  _canDelete(av) {
    if (!auth.isAuthenticated()) return false;
    return av.id_utilizador === this.currentUserId() || auth.isAdmin();
  }

  currentUserId() {
    try { return auth.getUser()?.id; } catch { return null; }
  }

  async reloadReviews() {
    try {
      const res = await api.get(`/stores/${this.storeId}/reviews`);
      this.reviews = res.data || { avaliacoes: [], estatisticas: { media: null, total: 0 } };
      // Actualiza só a secção de reviews
      const section = this.container.querySelector('#store-reviews-section');
      if (section) {
        const h2 = section.querySelector('.store-page__subtitle');
        if (h2) h2.textContent = `Avaliações ${this.reviews.estatisticas?.total ? `(${this.reviews.estatisticas.total})` : ''}`;
        const summary = section.querySelector('.store-reviews__summary span')?.parentElement;
        if (summary) summary.innerHTML = `${StorePage.starsHtml(this.reviews.estatisticas?.media ?? null)}<button type="button" class="btn btn--outline" id="btn-open-review">Avaliar esta loja</button>`;
        this.bindReviewOpenButton();
      }
      this.renderReviews();
      observeNewElements();
    } catch { /* silencioso */ }
  }

  bindReviewOpenButton() {
    this.container.querySelector('#btn-open-review')?.addEventListener('click', () => {
      if (!auth.isAuthenticated()) { router.navigate('/login'); return; }
      const form = this.container.querySelector('#review-form');
      if (form) form.hidden = !form.hidden;
    });
  }

  bindReviewForm() {
    this.bindReviewOpenButton();

    this.container.querySelector('#btn-cancel-review')?.addEventListener('click', () => {
      const form = this.container.querySelector('#review-form');
      if (form) { form.hidden = true; form.reset(); }
    });

    this.container.querySelector('#review-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const nota = Number(fd.get('nota'));
      const comentario = String(fd.get('comentario') || '');

      if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        toast.error('Escolhe uma nota de 1 a 5.');
        return;
      }

      try {
        const res = await api.post(`/stores/${this.storeId}/reviews`, { nota, comentario });
        toast.success(res.message || 'Avaliação publicada.');
        e.target.reset();
        e.target.hidden = true;
        await this.reloadReviews();
      } catch (err) {
        toast.error(err.status === 401 ? 'Entra na tua conta.' : 'Não foi possível publicar a avaliação.');
      }
    });
  }

  renderProducts() {
    const grid = this.container.querySelector('#store-products-grid');
    if (!grid) return;

    if (this.produtos.length === 0) {
      grid.innerHTML = `
        <div class="products-page__empty" style="grid-column:1/-1;">
          <div class="empty-icon">0</div>
          <h3>Sem produtos publicados</h3>
          <p>Esta loja ainda não tem ofertas no catálogo.</p>
        </div>`;
      return;
    }

    // Reutiliza o ProductCard mapeando o preço directo da loja.
    grid.innerHTML = this.produtos.map(p => new ProductCard({
      id: p.id,
      nome: p.nome,
      marca: p.marca,
      descricao: p.descricao,
      preco_min: p.preco_loja,
      total_lojas: 1,
      quantidade_total: p.quantidade,
      imagem: p.imagem,
    }).render()).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-add')) return;
        router.navigate(`/produto?id=${card.dataset.id}`);
      });
    });

    grid.querySelectorAll('.btn-add').forEach((btn, i) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const { auth } = await import('../auth.js');
        if (!auth.isAuthenticated()) { router.navigate('/login'); return; }
        const p = this.produtos[i];
        const { openAddToListModal } = await import('./ShoppingListPage.js');
        openAddToListModal(p.id, p.nome);
      });
    });

    observeNewElements();
  }
}
