/**
 * @file components/Footer.js
 * @description Rodapé estático da aplicação Price360.
 * Renderiza logo, colunas de links de navegação e conta, e copyright dinâmico.
 *
 * Uso:
 *   import { Footer } from './components/Footer.js';
 *   const footer = new Footer();
 *   footer.init(document.getElementById('footer-root'));
 */

export class Footer {
  /**
   * Gera o HTML completo do rodapé.
   * O ano no copyright é calculado dinamicamente.
   * @returns {string}
   */
  render() {
    return `
      <footer class="footer">
        <div class="footer__inner container">

          <!-- Branding -->
          <div class="footer__brand">
            <div class="footer__logo-text">PRICE<span>360</span></div>
            <p>Compare preços de produtos essenciais e encontre sempre a melhor oferta.</p>
          </div>

          <!-- Navegação -->
          <div>
            <h4 class="footer__title">Navegação</h4>
            <ul class="footer__links">
              <li><a href="#/">Home</a></li>
              <li><a href="#/produtos">Produtos</a></li>
              <li><a href="#/lista">Lista de Compras</a></li>
            </ul>
          </div>

          <!-- Conta -->
          <div>
            <h4 class="footer__title">Conta</h4>
            <ul class="footer__links">
              <li><a href="#/login">Login</a></li>
              <li><a href="#/cadastro">Criar Conta</a></li>
            </ul>
          </div>

        </div>

        <!-- Copyright -->
        <div class="footer__bottom">
          <span>© ${new Date().getFullYear()} Price360. Todos os direitos reservados.</span>
        </div>
      </footer>
    `;
  }

  /**
   * Injeta o rodapé no contentor fornecido.
   * @param {HTMLElement} container
   */
  init(container) {
    container.innerHTML = this.render();
  }
}
