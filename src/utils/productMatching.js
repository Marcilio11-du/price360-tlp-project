/**
 * @file utils/productMatching.js
 * @description Matching de produtos entre lojas: normalização de nomes e
 *              decisão "é o mesmo produto?" para o pipeline e o backfill.
 *
 * Regras (conservadoras, para nunca casar variantes diferentes):
 *   1. Normaliza-se o nome (sem acentos, pontuação, maiúsculas, ruído).
 *   2. Nomes normalizados iguais → mesmo produto.
 *   3. Senão, a ASSINATURA numérica tem de coincidir (128gb ≠ 256gb,
 *      55" ≠ 65", 1l ≠ 500ml) — sem assinatura dos dois lados, segue-se.
 *   4. E a similaridade Jaccard sobre os restantes tokens ≥ 0.8.
 */

const NOISE_TOKENS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'com', 'para', 'em', 'e', 'o', 'a', 'os',
  'as', 'um', 'uma', 'the', 'novo', 'nova', 'original', 'kit', 'unidade',
]);

/** Minúsculas, sem acentos, só letras/números/espaços colapsados. */
function normalizeName(value) {
  return String(value || '')
    .replace(/\+/g, ' plus ')   // S20+ ≠ S20
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Tokens relevantes do nome (sem palavras de ruído). */
function nameTokens(value) {
  return normalizeName(value)
    .split(' ')
    .filter((t) => t && !NOISE_TOKENS.has(t));
}

/**
 * Assinatura técnica: os grupos numéricos do nome
 * (capacidades, dimensões, voltagens, modelos).
 * "TV Samsung 55 Polegadas" → ["55"] · "iPhone 13 128GB" → ["13","128"]
 */
function signatureTokens(value) {
  return normalizeName(value).match(/\d+(?:[.,]\d+)?/g) || [];
}

/**
 * Decide se dois nomes representam o mesmo produto.
 * @param {string} nameA
 * @param {string} nameB
 * @returns {boolean}
 */
function areSameProduct(nameA, nameB) {
  const na = normalizeName(nameA);
  const nb = normalizeName(nameB);
  if (!na || !nb) return false;
  if (na === nb) return true;

  // Se QUALQUER lado tem assinatura numérica, têm de ser iguais.
  // Impede "Leitor de cartão" (sem modelo) de engolir "…DS-K1102AE".
  const sigA = signatureTokens(nameA).join(' ');
  const sigB = signatureTokens(nameB).join(' ');
  if ((sigA || sigB) && sigA !== sigB) return false;

  const tokA = new Set(nameTokens(nameA));
  const tokB = new Set(nameTokens(nameB));
  if (!tokA.size || !tokB.size) return false;

  // Se a ÚNICA diferença forem tokens de variante (S20+/S20, Pro/Max,
  // cores), são produtos distintos — nunca fundir.
  const soEmA = [...tokA].filter(t => !tokB.has(t));
  const soEmB = [...tokB].filter(t => !tokA.has(t));
  const VARIANTES = new Set(['plus', 'pro', 'max', 'ultra', 'mini', 'lite',
    'note', 'se', 'preto', 'branco', 'cinza', 'azul', 'verde', 'vermelho',
    'rosa', 'dourado', 'prateado']);
  if ((soEmA.length || soEmB.length) &&
      [...soEmA, ...soEmB].every(t => VARIANTES.has(t))) {
    return false;
  }

  let intersection = tokA.size - soEmA.length;
  const union = new Set([...tokA, ...tokB]).size;

  return union > 0 && intersection / union >= 0.8;
}

module.exports = { normalizeName, nameTokens, signatureTokens, areSameProduct };
