/**
 * @file components/Modal.js
 * @description Modal global singleton. Injeta HTML no elemento #modal-root.
 * Suporta título, corpo HTML arbitrário, botão de confirmação assíncrono
 * e estado de loading durante a operação.
 *
 * Abertura: overlay + card fazem fade-in + slide-up suave com blur.
 * Fecho: animação de saída antes de limpar o DOM (close com delay).
 *
 * Uso:
 *   import { modal } from './components/Modal.js';
 *   modal.open({
 *     title: 'Confirmar remoção',
 *     body: '<p>Tens a certeza?</p>',
 *     onConfirm: async () => { await api.delete('/item/1'); },
 *     confirmText: 'Eliminar',
 *     size: 'sm'
 *   });
 */

/** Referência ao contentor DOM (lazy init) */
let modalRoot = null;

/** Duração da animação de saída em ms — deve coincidir com a transition do CSS */
const CLOSE_DURATION = 260;

/**
 * Devolve (ou localiza) o elemento raiz do modal no DOM.
 * @returns {HTMLElement|null}
 */
const getRoot = () => {
  if (!modalRoot) modalRoot = document.getElementById('modal-root');
  return modalRoot;
};

export const modal = {
  /**
   * Abre o modal com as opções fornecidas.
   *
   * @param {Object}   options
   * @param {string}   [options.title='']           - Título do modal
   * @param {string}   [options.body='']            - HTML do corpo
   * @param {Function} [options.onConfirm=null]     - Callback assíncrono do botão confirmar
   * @param {string}   [options.confirmText='Confirmar'] - Texto do botão confirmar
   * @param {string}   [options.cancelText='Cancelar']   - Texto do botão cancelar
   * @param {string}   [options.size='']            - Modificador de tamanho: 'sm' | 'lg' | ''
   */
  open({
    title       = '',
    body        = '',
    onConfirm   = null,
    confirmText = 'Confirmar',
    cancelText  = 'Cancelar',
    size        = ''
  } = {}) {
    const root = getRoot();
    if (!root) return;

    // Injecta o HTML sem a classe modal--open (estado "fechado" inicial)
    root.innerHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal ${size ? 'modal--' + size : ''}">
          <div class="modal__header">
            <h3>${title}</h3>
            <button class="modal__close btn btn--icon btn--ghost" id="modal-close" aria-label="Fechar">✕</button>
          </div>
          <div class="modal__body">${body}</div>
          <div class="modal__footer">
            <button class="btn btn--cancel-form" id="modal-cancel">${cancelText}</button>
            ${onConfirm
              ? `<button class="btn btn--save" id="modal-confirm">${confirmText}</button>`
              : ''}
          </div>
        </div>
      </div>
    `;

    // Forçar reflow antes de adicionar modal--open garante que a transição CSS dispara
    const overlay = root.querySelector('#modal-overlay');
    overlay.getBoundingClientRect(); // flush layout
    overlay.classList.add('modal--open');

    // Fechar ao clicar no X ou no botão cancelar
    root.querySelector('#modal-close')?.addEventListener('click',  () => this.close());
    root.querySelector('#modal-cancel')?.addEventListener('click', () => this.close());

    // Fechar ao clicar no overlay (fora do modal card)
    overlay?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    // Tecla Escape fecha o modal
    this._onKeyDown = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._onKeyDown);

    // Botão de confirmação assíncrono
    if (onConfirm) {
      root.querySelector('#modal-confirm')?.addEventListener('click', async () => {
        this.setLoading(true);
        try {
          await onConfirm();
        } finally {
          this.setLoading(false);
        }
      });
    }
  },

  /**
   * Fecha o modal com animação de saída suave antes de limpar o DOM.
   */
  close() {
    const root = getRoot();
    if (!root) return;

    const overlay = root.querySelector('#modal-overlay');
    if (!overlay) return;

    // Remove listener do Escape
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }

    // Troca modal--open por modal--closing para disparar transição de saída
    overlay.classList.remove('modal--open');
    overlay.classList.add('modal--closing');

    // Limpa o DOM após a animação terminar
    setTimeout(() => {
      if (root) root.innerHTML = '';
    }, CLOSE_DURATION);
  },

  /**
   * Activa ou desactiva o estado de loading no botão confirmar.
   * @param {boolean} loading
   */
  setLoading(loading) {
    const btn = document.getElementById('modal-confirm');
    if (!btn) return;
    btn.disabled    = loading;
    btn.textContent = loading ? 'A guardar...' : 'Guardar alterações';
  }
};