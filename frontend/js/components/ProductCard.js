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

import { formatPrice } from '../utils.js';
import { auth }        from '../auth.js';
import { toast }       from './Toast.js';
import { api }         from '../api.js';

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

  /**
   * Gera o HTML do card. O elemento inclui classes de animação scroll.
   * @returns {string}
   */
  render() {
    const { produto_nome, loja_nome, preco, quantidade, produto_descricao } = this.data;
    const available = quantidade > 0;

    return `
      <div class="product-card animate-scroll"
           data-id="${this.data.id}"
           data-produto="${this.data.id_produto}">

        <!-- Imagem + badge -->
        <div class="product-card__image-wrapper">
          <img
            src="./assets/products/${this.data.id_produto}.jpg"
            alt="${produto_nome}"
            onerror="this.src='./assets/product-placeholder.png'"
            class="product-card__image"
            loading="lazy"
          />
          ${this.isBestPrice
            ? `<div class="product-card__badge">BEST<br>PRICE</div>`
            : ''}
        </div>

        <!-- Informação -->
        <div class="product-card__body">
          <span class="product-card__price">${formatPrice(preco)}</span>
          <h3 class="product-card__name">${produto_nome}</h3>

          ${produto_descricao
            ? `<p class="product-card__description">
                 <strong>Descrição:</strong> ${produto_descricao}
               </p>`
            : ''}

          <p class="product-card__store">
            Vendido por <strong>${loja_nome}</strong>
          </p>

          <span class="product-card__availability product-card__availability--${available ? 'available' : 'unavailable'}">
            ${available ? 'Disponível' : 'Indisponível'}
          </span>

          <!-- Acções -->
          <div class="product-card__actions">
            <button class="btn-visit-store" data-store="${loja_nome}">
              Visitar loja
            </button>
            <button
              class="btn-add btn btn--icon"
              aria-label="Adicionar à lista"
              data-produto="${this.data.id_produto}"
            >+</button>
          </div>
        </div>

      </div>
    `;
  }
}
