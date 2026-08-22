/**
 * @file components/Footer.js
 * @description Rodapé da aplicação Xé Preço.
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
              <span class="footer__logo-text">Xé Preço</span>
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



        </div>

        <!-- Linha inferior -->
        <div class="footer__bottom">
          <span class="footer__credits">Anselmo Gomes • Marcílio Domingos • Neil Dias</span>
          <span class="footer__copyright">Xé Preço © ${new Date().getFullYear()}</span>
        </div>
      </footer>
    `;
  }

  init(container) {
    container.innerHTML = this.render();
  }
}
