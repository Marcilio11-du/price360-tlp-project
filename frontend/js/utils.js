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
