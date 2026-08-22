/**
 * @file components/ProductCard.js
 * @description Card visual para um registo de Produto_Loja.
 * Mostra preço formatado, nome, descrição, loja, disponibilidade
 * e acções de visitar loja / adicionar à lista.
 *
 * Uso:
 *   import { ProductCard } from './components/ProductCard.js';
 *   const card = new ProductCard(produtoLojaData, isBestPrice);
 *   container.innerHTML += card.render();
 */

import { formatPrice, productImgHtml } from '../utils.js';

export class ProductCard {
  /**
   * @param {Object}  data            - Registo de Produto_Loja vindo da API
   * @param {number}  data.id         - ID do registo Produto_Loja
   * @param {number}  data.id_produto - ID do produto
   * @param {string}  data.produto_nome
   * @param {string}  data.loja_nome
   * @param {number}  data.preco
   * @param {number}  data.quantidade
   * @param {string}  [data.produto_descricao]
   * @param {boolean} [isBestPrice=false] - Mostra badge "BEST PRICE" se true
   */
  constructor(data, isBestPrice = false) {
    this.data        = data;
    this.isBestPrice = isBestPrice;
  }

  resolveImage() {
    const rawImage = this.data?.imagem || this.data?.image || this.data?.product_image;
    if (typeof rawImage === 'string' && /^https?:\/\//i.test(rawImage.trim())) {
      return rawImage.trim();
    }
    // Sem imagem real → placeholder neutro (nada de fotos de stock inventadas)
    return null;
  }

  /**
   * Gera o HTML do card. O elemento inclui classes de animação scroll.
   * @returns {string}
   */
  render() {
    const { id, nome, marca, descricao, preco_min, total_lojas, quantidade_total } = this.data;
    const available = quantidade_total > 0;
    const imageUrl = this.resolveImage();

    return `
      <div class="product-card animate-scroll"
           data-id="${id}"
           data-produto="${id}">

        <!-- Imagem + badge -->
        <div class="product-card__image-wrapper">
          ${productImgHtml(imageUrl, nome, 'product-card__image')}
          ${this.isBestPrice
            ? `<div class="product-card__badge">BEST<br>PRICE</div>`
            : ''}
        </div>

        <!-- Informação -->
        <div class="product-card__body">
          <span class="product-card__price">a partir de ${formatPrice(preco_min)}</span>
          <h3 class="product-card__name">${nome}</h3>

          ${descricao
            ? `<p class="product-card__description">
                 ${marca ? `<strong>${marca}</strong> · ` : ''}${descricao}
               </p>`
            : ''}

          <p class="product-card__store">
            <strong>${total_lojas} loja${total_lojas !== 1 ? 's' : ''} disponível${total_lojas !== 1 ? 'is' : ''}</strong>
          </p>

          <span class="product-card__availability product-card__availability--${available ? 'available' : 'unavailable'}">
            ${available ? 'Disponível' : 'Indisponível'}
          </span>

          <!-- Acção -->
          <div class="product-card__actions">
            <button
              class="btn-add btn btn--icon"
              aria-label="Adicionar à lista"
              data-produto="${id}"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    `;
  }
}
