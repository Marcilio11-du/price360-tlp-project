/**
 * @file components/Footer.js
 * @description Rodapé da aplicação Price360 — conforme protótipo.
 * Colunas: logo + descrição | Categorias (3 sub-colunas) | Informações de contacto
 */

export class Footer {
  render() {
    return `
      <footer class="footer">
        <div class="footer__inner container">

          <!-- Branding -->
          <div class="footer__brand">
            <div class="footer__logo">
              <img src="./assets/logo.png" alt="Price360" onerror="this.style.display='none'">
            </div>
            <p>Compare preços de produtos essenciais e encontre sempre a melhor oferta.</p>
          </div>

          <!-- Categorias dos produtos -->
          <div class="footer__categories">
            <h4 class="footer__title">Categorias dos produtos</h4>
            <div class="footer__categories-grid">

              <div class="footer__cat-col">
                <span class="footer__cat-heading">Bens de Consumo Rápido (FMCG)</span>
                <ul class="footer__links">
                  <li><a href="#/produtos?categoria=1">Arroz, Grãos e Massas</a></li>
                  <li><a href="#/produtos?categoria=2">Óleos e Temperos</a></li>
                  <li><a href="#/produtos?categoria=3">Laticínios e Ovos</a></li>
                  <li><a href="#/produtos?categoria=4">Talho e Peixaria</a></li>
                  <li><a href="#/produtos?categoria=5">Padaria e Pastelaria</a></li>
                  <li><a href="#/produtos?categoria=6">Frutas e Legumes</a></li>
                  <li><a href="#/produtos?categoria=7">Bebidas e Sumos</a></li>
                  <li><a href="#/produtos?categoria=8">Cervejas e Vinhos</a></li>
                </ul>
              </div>

              <div class="footer__cat-col">
                <span class="footer__cat-heading">Higiene e Limpeza</span>
                <ul class="footer__links">
                  <li><a href="#/produtos?categoria=9">Higiene Pessoal</a></li>
                  <li><a href="#/produtos?categoria=10">Limpeza da Casa</a></li>
                  <li><a href="#/produtos?categoria=11">Cuidados do Bebé</a></li>
                </ul>
              </div>

              <div class="footer__cat-col">
                <span class="footer__cat-heading">Diversos</span>
                <ul class="footer__links">
                  <li><a href="#/produtos?categoria=12">Conservas e Enlatados</a></li>
                  <li><a href="#/produtos?categoria=13">Snacks e Doces</a></li>
                  <li><a href="#/produtos?categoria=14">Congelados Prontos</a></li>
                  <li><a href="#/produtos?categoria=15">Pet Shop</a></li>
                </ul>
              </div>

            </div>
          </div>

          <!-- Informações de contacto -->
          <div class="footer__contact">
            <h4 class="footer__title">Informações de contacto</h4>
            <ul class="footer__contact-list">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
                </svg>
                <a href="https://github.com/price360" target="_blank" rel="noopener">@price360</a>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <a href="mailto:price360@gmail.com">price360@gmail.com</a>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
                <a href="tel:+244932070062">+244 932 070 062</a>
              </li>
            </ul>
          </div>

        </div>

        <!-- Linha inferior -->
        <div class="footer__bottom">
          <span class="footer__credits">Anselmo Gomes • Marcílio Domingos • Neil Dias</span>
          <span class="footer__copyright">Price360 © ${new Date().getFullYear()}</span>
        </div>
      </footer>
    `;
  }

  init(container) {
    container.innerHTML = this.render();
  }
}
