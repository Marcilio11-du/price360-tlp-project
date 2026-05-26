/**
 * @file app.js
 * @description Entry point principal da SPA Price360.
 *
 * Responsabilidades:
 *  1. Renderiza a Navbar persistente em #navbar-root
 *  2. Regista todas as rotas no router
 *  3. Aplica efeito scroll na navbar
 *  4. Inicializa o sistema de animações
 *  5. Arranca o router (resolve rota inicial)
 */

import { router }          from './router.js';
import { auth }            from './auth.js';
import { initAnimations }  from './animations.js';
import { Navbar }          from './components/Navbar.js';
import { Footer }          from './components/Footer.js';

// --- Páginas ---
import HomePage            from './pages/HomePage.js';
import ProductsPage        from './pages/ProductsPage.js';
import LoginPage           from './pages/LoginPage.js';
import RegisterPage        from './pages/RegisterPage.js';
import OnboardingPage      from './pages/OnboardingPage.js';
import ShoppingListPage    from './pages/ShoppingListPage.js';
import ProfilePage         from './pages/ProfilePage.js';
import AdminDashboardPage  from './pages/AdminDashboardPage.js';

// ─── 1. Navbar persistente ────────────────────────────────────────────────────
const navbarRoot = document.getElementById('navbar-root');
if (navbarRoot) {
  const navbar = new Navbar({ auth, router });
  navbar.init(navbarRoot);
}

// ─── 2. Registo de rotas ──────────────────────────────────────────────────────
router.register('/',         (container) => new HomePage(container).render());
router.register('/produtos', (container) => new ProductsPage(container).render());
router.register('/login',    (container) => new LoginPage(container).render());
router.register('/cadastro', (container) => new RegisterPage(container).render());
router.register('/onboarding', (container) => new OnboardingPage(container).render());
router.register('/lista',    (container) => new ShoppingListPage(container).render());
router.register('/profile',  (container) => new ProfilePage(container).render());
router.register('/admin',    (container) => new AdminDashboardPage(container).render());

/** Página 404 inline */
router.register('/404', (container) => {
  container.innerHTML = `
    <div style="text-align:center;padding:6rem 1rem">
      <div style="width:68px;height:68px;border-radius:50%;margin:0 auto;background:rgba(21,101,192,.08);display:flex;align-items:center;justify-content:center;color:var(--color-primary);font-weight:900;font-size:1.6rem">404</div>
      <h2 style="font-size:2rem;font-weight:800;margin:1rem 0">Página não encontrada</h2>
      <p style="color:#757575;margin-bottom:2rem">A página que procuras não existe.</p>
      <a href="#/" class="btn btn--primary">Voltar ao início</a>
    </div>
  `;
});

// ─── 3. Efeito scroll na navbar ───────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbarEl = document.querySelector('.navbar');
  if (navbarEl) {
    navbarEl.classList.toggle('navbar--scrolled', window.scrollY > 10);
  }
});

// Navbar visibility on first load (Navbar.js handles subsequent route changes)
{
  const navbarRoot = document.getElementById('navbar-root');
  const currentPath = router.getCurrentPath();
  const hideNavbarRoutes = ['/login', '/cadastro', '/onboarding'];
  if (navbarRoot && hideNavbarRoutes.includes(currentPath)) {
    navbarRoot.style.display = 'none';
  }
}

// ─── 4 & 5. Animações + router ───────────────────────────────────────────────
initAnimations();
router.init();