/**
 * @file components/Loader.js
 * @description Utilitários de estado de carregamento.
 * Fornece um spinner central e skeleton cards para listas de produtos.
 *
 * Uso:
 *   import { Loader } from './components/Loader.js';
 *
 *   // Spinner simples
 *   container.innerHTML = Loader.render();
 *
 *   // Skeletons em grelha (ex: 8 cards)
 *   container.innerHTML = Loader.renderSkeleton(8);
 */

export const Loader = {
  /**
   * Devolve o HTML de um spinner centrado.
   * @returns {string}
   */
  render: () => `
    <div class="loader">
      <div class="loader__spinner"></div>
    </div>
  `,

  /**
   * Devolve o HTML de `count` skeleton cards para grelha de produtos.
   * @param {number} [count=4] - Número de placeholders a gerar
   * @returns {string}
   */
  renderSkeleton: (count = 4) =>
    Array(count)
      .fill(0)
      .map(
        () => `
          <div class="skeleton-card">
            <div class="skeleton skeleton--image"></div>
            <div style="padding:1rem;display:flex;flex-direction:column;gap:0.5rem">
              <div class="skeleton skeleton--title"></div>
              <div class="skeleton skeleton--text"></div>
              <div class="skeleton skeleton--text" style="width:60%"></div>
            </div>
          </div>
        `
      )
      .join('')
};
