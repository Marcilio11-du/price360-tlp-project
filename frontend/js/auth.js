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
   if (!token || !user || !user.id) {
     this.logout();
     return;
   }
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
     const raw = localStorage.getItem(USER_KEY);
     if (!raw) return null;
     const parsed = JSON.parse(raw);
     return parsed && typeof parsed === 'object' && parsed.id ? parsed : null;
   } catch {
     return null;
   }
  },

  /**
   * Indica se existe sessão activa (token presente e user válido).
   * @returns {boolean}
   */
  isAuthenticated() {
   const token = this.getToken();
   const user = this.getUser();

   if (!token && !user) return false;
   if (!token || !user) {
     this.logout({ redirect: false, silent: true });
     return false;
   }

   return true;
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
  logout({ redirect = true, silent = false } = {}) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (redirect && !silent) {
      const currentHash = window.location.hash || '#/';
      if (currentHash !== '#/') {
        window.location.hash = '#/';
      }
    }
  }
};
