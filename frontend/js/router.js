/**
 * @file router.js
 * @description Router hash-based para a SPA Price360.
 * Suporta rotas protegidas (requerem auth) e rotas de admin.
 *
 * Rotas registadas em app.js:
 *   /           → HomePage
 *   /produtos   → ProductsPage
 *   /login      → LoginPage
 *   /cadastro   → RegisterPage
 *   /lista      → ShoppingListPage  (requer auth)
 *   /admin      → AdminDashboardPage (requer admin)
 */

import { auth } from './auth.js';

/** @type {Object.<string, function(HTMLElement): Promise<void>|void>} */
const routes = {};

/** Rotas que requerem utilizador autenticado */
const protectedRoutes = ['/lista'];

/** Rotas que requerem role 'admin' */
const adminRoutes = ['/admin'];

export const router = {
  /**
   * Regista um handler para um dado path.
   * @param {string} path        - Ex: '/produtos'
   * @param {function(HTMLElement): Promise<void>|void} handler
   */
  register(path, handler) {
    routes[path] = handler;
  },

  /**
   * Navega para o path dado, actualizando o hash da URL.
   * @param {string} path - Ex: '/produtos' ou '/produtos?q=arroz'
   */
  navigate(path) {
    const [rawPath, query = ''] = String(path || '/').split('?');
    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    window.location.hash = `#${normalizedPath}${query ? `?${query}` : ''}`;
  },

  /**
   * Devolve o path actual sem query string.
   * @returns {string}  Ex: '/produtos'
   */
  getCurrentPath() {
    const hash = window.location.hash.slice(1) || '/';
    const basePath = hash.split('?')[0] || '/';
    if (basePath.length > 1 && basePath.endsWith('/')) {
      return basePath.slice(0, -1);
    }
    return basePath.startsWith('/') ? basePath : `/${basePath}`;
  },

  /**
   * Devolve os query params do hash actual como objecto.
   * @returns {Object.<string, string>}  Ex: { q: 'arroz' }
   */
  getQueryParams() {
    const hash = window.location.hash.slice(1) || '/';
    const qs   = hash.split('?')[1] || '';
    return Object.fromEntries(new URLSearchParams(qs));
  },

  /**
   * Resolve a rota actual: valida permissões, limpa #app e chama o handler.
   * @returns {Promise<void>}
   */
  async resolve() {
    const path = this.getCurrentPath();

    // --- Protecção de rotas ---
    if (protectedRoutes.includes(path) && !auth.isAuthenticated()) {
      this.navigate('/login');
      return;
    }
    if (adminRoutes.includes(path) && !auth.isAdmin()) {
      this.navigate('/');
      return;
    }

    const handler = routes[path] || routes['/404'];
    if (!handler) return;

    const appEl = document.getElementById('app');
    appEl.innerHTML = ''; // limpa o conteúdo anterior

    await handler(appEl);

    // Re-observa elementos animados após cada render
    import('./animations.js').then(m => m.observeNewElements());

    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Inicializa o router: regista o listener de hashchange e resolve a rota inicial.
   */
  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }
};