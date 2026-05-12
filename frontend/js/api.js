/**
 * @file api.js
 * @description Cliente HTTP para a API REST do Price360.
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

      if (activeApiBase !== base) {
        activeApiBase = base;
        window.localStorage.setItem('price360_api_base', base);
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
