/**
 * @file utils.js
 * @description Funções utilitárias puras reutilizadas em toda a aplicação.
 * Sem dependências externas.
 */

/**
 * Formata um valor numérico como preço angolano (Kwanza).
 * Para valores >= 1000 usa separador de milhar no formato pt-PT (ex: "1.500,00 Kz").
 * Para valores < 1000 usa formato simples (ex: "950,00 Kz").
 *
 * @param {number|string} value
 * @returns {string}  Ex: "1.500,00 Kz" ou "99,90 Kz"
 */
export const formatPrice = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '0,00 Kz';

  const formatted = num.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${formatted} Kz`;
};

/**
 * Cria uma versão "debounced" de uma função — só é executada após
 * `delay` ms sem novas chamadas.
 *
 * @param {Function} fn    - Função a adiar
 * @param {number}   delay - Tempo de espera em milissegundos
 * @returns {Function}
 */
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Corta um texto ao comprimento máximo indicado, adicionando "…" se necessário.
 *
 * @param {string} text - Texto original
 * @param {number} max  - Número máximo de caracteres
 * @returns {string}
 */
export const truncate = (text, max) => {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '…';
};

/**
 * Formata uma data ISO (ou "YYYY-MM-DD") para o formato "dd/mm/aaaa".
 *
 * @param {string} dateStr - Ex: "2024-01-15" ou "2024-01-15T10:30:00.000Z"
 * @returns {string}       Ex: "15/01/2024"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  // Remove a parte de tempo se existir (ISO 8601)
  const datePart = dateStr.split('T')[0];
  const parts    = datePart.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Devolve as iniciais de um nome próprio e apelido.
 *
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}  Ex: "AB"
 */
export const getInitials = (firstName, lastName) => {
  const first = (firstName?.[0] || '').toUpperCase();
  const last  = (lastName?.[0]  || '').toUpperCase();
  return `${first}${last}`;
};

/**
 * Placeholder neutro para produtos sem imagem real.
 * Data-URI SVG (caixa/embalagem estilizada) — nada de fotos de stock inventadas.
 */
export const PRODUCT_PLACEHOLDER_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="16" fill="#eef1f5"/>
    <path d="M60 28l26 13v30L60 84 34 71V41z" fill="none" stroke="#b8c2cf" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M34 41l26 13 26-13M60 54v30" fill="none" stroke="#b8c2cf" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="86" cy="36" r="9" fill="#22c55e"/>
    <path d="M82.4 36l2.6 2.6 4.6-5.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
)}`;

/**
 * Devolve a tag <img> do produto: usa a imagem real quando existe URL
 * válido; caso contrário (ou se falhar ao carregar) mostra o placeholder.
 *
 * @param {string} [url]      - URL da imagem (Produto_Loja.imagem)
 * @param {string} alt        - Texto alternativo
 * @param {string} [cls='']   - Classes CSS extra
 * @returns {string} HTML
 */
export const productImgHtml = (url, alt, cls = '') => {
  const safeAlt = String(alt || 'Imagem do produto').replace(/"/g, '&quot;');
  const valid = typeof url === 'string' && /^https?:\/\//i.test(url.trim());
  const src = valid ? url.trim() : PRODUCT_PLACEHOLDER_IMG;
  return `<img src="${src}" alt="${safeAlt}" class="${cls}" loading="lazy"
    onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER_IMG}'">`;
};

/**
 * Estado dedicado de "catálogo ainda a ser populado" (primeira execução).
 * Mostrado quando a lista vem vazia sem filtros activos e o endpoint
 * /store-products/catalog-status indica populado === false.
 */
export const CATALOG_BOOTSTRAP_NOTICE_HTML = `
  <div class="catalog-bootstrap-notice">
    <div class="catalog-bootstrap-notice__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none"
           stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22v-9"/>
        <path d="M12 13c-1.5-1.5-4-4-4-6.5C8 4.5 9.8 3 12 3s4 1.5 4 3.5c0 2.5-2.5 5-4 6.5z"/>
      </svg>
    </div>
    <h3>A preparar o catálogo</h3>
    <p>A preparar o catálogo com dados reais das lojas parceiras pela
       primeira vez — isto pode levar alguns minutos. Actualiza a página
       daqui a pouco.</p>
  </div>
`;
