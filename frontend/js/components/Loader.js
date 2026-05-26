/**
 * @file components/Loader.js
 * @description Utilitários de estado de carregamento com Skeleton Screens.
 */

export const Loader = {
  render: () => `
    <div class="loader">
      <div class="loader__spinner"></div>
    </div>
  `,

  /**
   * Skeleton para cards de produto — desktop (imagem lateral + info)
   */
  renderSkeleton: (count = 4) =>
    Array(count)
      .fill(0)
      .map(
        () => `
          <div class="skeleton-card">
            <div class="skeleton skeleton--image"></div>
            <div class="skeleton-card__body">
              <div class="skeleton skeleton--price"></div>
              <div class="skeleton skeleton--title"></div>
              <div class="skeleton skeleton--text"></div>
              <div class="skeleton skeleton--text" style="width:65%"></div>
              <div class="skeleton skeleton--text" style="width:50%;margin-top:4px"></div>
              <div class="skeleton-card__actions-placeholder">
                <div class="skeleton skeleton--btn"></div>
                <div class="skeleton skeleton--icon"></div>
              </div>
            </div>
          </div>
        `
      )
      .join(''),

  /**
   * Skeleton para category cards (ícone + label)
   */
  renderCategorySkeleton: (count = 10) =>
    Array(count)
      .fill(0)
      .map(
        () => `
          <div class="skeleton-category">
            <div class="skeleton skeleton--cat-icon"></div>
            <div class="skeleton skeleton--cat-label"></div>
          </div>
        `
      )
      .join(''),
};
