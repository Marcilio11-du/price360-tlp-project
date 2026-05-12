/**
 * @file auth.js
 * @description Módulo de autenticação — lê/escreve token e user no localStorage.
 * Expõe um singleton `auth` com helpers de sessão.
 */

const TOKEN_KEY = 'price360_token';
const USER_KEY  = 'price360_user';

export const auth = {
  /**
   * Persiste o token JWT e o objecto do utilizador.
   * @param {string} token
   * @param {{ id: number, email: string, role: string, p_nome?: string }} user
   */
  setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Devolve o token JWT guardado, ou null se não existir.
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Devolve o objecto do utilizador ou null se não existir / inválido.
   * @returns {{ id: number, email: string, role: string, p_nome?: string }|null}
   */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },

  /**
   * Indica se existe sessão activa (token presente).
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(this.getToken());
  },

  /**
   * Indica se o utilizador autenticado tem role 'admin'.
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getUser();
    return user?.role === 'admin';
  },

  /**
   * Termina a sessão: limpa localStorage e redireciona para /.
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.hash = '#/';
    window.location.reload();
  }
};
