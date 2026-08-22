/**
 * @file api.js
 * @description Cliente HTTP para a API REST do Xé Preço.
 * Anexa automaticamente o Bearer token e normaliza respostas de erro.
 *
 * Todos os métodos devolvem uma Promise que resolve com o corpo JSON
 * da resposta ou lança um Error enriquecido com `status` e `details`.
 */

import { auth } from './auth.js';

const API_BASE_CANDIDATES = [
  window.localStorage.getItem('price360_api_base') || '',
  `${window.location.origin}/api/v1`,
  'http://localhost:3000/api/v1',
  'http://127.0.0.1:3000/api/v1',
  'http://localhost:3001/api/v1',
].filter(Boolean);

let activeApiBase = API_BASE_CANDIDATES[0];

/**
 * Verifica se a resposta tem a forma das nossas respostas de API
 * ({ status, data, message }). Respostas HTML/lixo (ex.: Live Server,
 * página de erro do navegador) são rejeitadas para tentar a base seguinte.
 */
const looksLikeApiResponse = (data) =>
  data !== null &&
  typeof data === 'object' &&
  !Array.isArray(data) &&
  ('status' in data || 'data' in data || 'message' in data);

/**
 * Função interna que executa o pedido fetch.
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} endpoint  - Caminho relativo, ex: '/produtos'
 * @param {Object|null} body - Corpo JSON opcional
 * @returns {Promise<Object>}
 */
const request = async (method, endpoint, body = null) => {
  const headers = { 'Content-Type': 'application/json' };

  const token = auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const tryBases = [
    activeApiBase,
    ...API_BASE_CANDIDATES.filter((base) => base !== activeApiBase),
  ];

  let lastError = null;

  for (const base of tryBases) {
    try {
      const response = await fetch(`${base}${endpoint}`, config);
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok) {
        const error = new Error(
          data.message ||
            (response.status === 404
              ? 'Rota da API não encontrada. Verifica se o backend está ativo e com prefixo /api/v1.'
              : 'Erro na requisição'),
        );
        error.status = response.status;
        error.details = data.details;
        error.apiBase = base;
        throw error;
      }

      // Resposta OK mas não é a nossa API (ex.: base velha no localStorage
      // a servir HTML) → tenta a próxima base em vez de aceitar lixo.
      if (!looksLikeApiResponse(data)) {
        const error = new TypeError(`Resposta de ${base} não é da API do Xé Preço.`);
        error.name = 'TypeError';
        throw error;
      }

      if (activeApiBase !== base) {
        activeApiBase = base;
        window.localStorage.setItem('price360_api_base', base);
        console.info('[Xé Preço] API ativa:', base);
      }

      return data;
    } catch (error) {
      lastError = error;
      const shouldTryNext =
        error.status === 404 ||
        error.name === 'TypeError' ||
        /Failed to fetch|NetworkError/i.test(error.message || '');

      if (!shouldTryNext) break;
    }
  }

  // Nenhuma base respondeu com a nossa API — limpa base velha do localStorage
  // para a próxima tentativa recomeçar do zero.
  if (lastError && lastError.status === undefined) {
    window.localStorage.removeItem('price360_api_base');
    activeApiBase = API_BASE_CANDIDATES[0] || `${window.location.origin}/api/v1`;
  }
  console.warn('[Xé Preço] Falha ao contactar a API. Última base tentada:', lastError?.apiBase, '—', lastError?.message);

  throw lastError || new Error('Falha ao contactar a API.');
};

export const api = {
  /**
   * GET  /endpoint
   * @param {string} endpoint
   * @returns {Promise<{status: string, data: any, message?: string}>}
   */
  get: (endpoint) => request('GET', endpoint),

  /**
   * POST /endpoint  com corpo JSON
   * @param {string} endpoint
   * @param {Object} body
   * @returns {Promise<{status: string, data: any, message?: string}>}
   */
  post: (endpoint, body) => request('POST', endpoint, body),

  /**
   * PUT  /endpoint  com corpo JSON
   * @param {string} endpoint
   * @param {Object} body
   * @returns {Promise<{status: string, data: any, message?: string}>}
   */
  put: (endpoint, body) => request('PUT', endpoint, body),

  /**
   * DELETE /endpoint
   * @param {string} endpoint
   * @returns {Promise<{status: string, data: any, message?: string}>}
   */
  delete: (endpoint) => request('DELETE', endpoint)
};
