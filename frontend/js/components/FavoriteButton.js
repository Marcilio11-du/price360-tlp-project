/**
 * @file components/FavoriteButton.js
 * @description Coração de favoritos nos product-cards.
 * `decorateProductCards(container)` adiciona o botão a todos os cards
 * do container, marca os já favoritados (via /favorites/ids) e liga
 * os cliques ao toggle na API.
 */

import { api } from '../api.js';
import { auth } from '../auth.js';
import { router } from '../router.js';
import { toast } from './Toast.js';

/** Cache curto dos ids favoritados do utilizador (uma fetch por página). */
let favIdsCache = null;

export const invalidateFavoritesCache = () => { favIdsCache = null; };

const HEART_SVG = `
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
       stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>`;

/**
 * Marca visualmente um botão como activo/inactivo.
 */
const setActive = (btn, active) => btn.classList.toggle('btn-fav--active', active);

const toggleFavorite = async (e, btn) => {
  e.preventDefault();
  e.stopPropagation();

  if (!auth.isAuthenticated()) {
    toast.info('Entra na tua conta para guardar favoritos.');
    router.navigate('/login');
    return;
  }

  const pid = Number(btn.dataset.produto);
  const wasActive = btn.classList.contains('btn-fav--active');

  // Optimista: actualiza já, reverte se falhar.
  setActive(btn, !wasActive);

  try {
    if (wasActive) {
      await api.delete(`/favorites/${pid}`);
      toast.success('Removido dos favoritos.');
    } else {
      await api.post('/favorites', { id_produto: pid });
      toast.success('Adicionado aos favoritos.');
    }
    favIdsCache = null;
  } catch (err) {
    setActive(btn, wasActive);
    favIdsCache = null;
    toast.error('Não foi possível actualizar os favoritos.');
  }
};

/**
 * Adiciona e liga corações a todos os .product-card dentro de container.
 * Idempotente: cards que já tenham .btn-fav são ignorados.
 *
 * @param {HTMLElement} container
 */
export const decorateProductCards = async (container) => {
  if (!container) return;

  let ids = new Set();
  if (auth.isAuthenticated()) {
    try {
      if (!favIdsCache) {
        favIdsCache = new Set((await api.get('/favorites/ids')).data || []);
      }
      ids = favIdsCache;
    } catch { /* sem favoritos marcados */ }
  }

  container.querySelectorAll('.product-card').forEach((card) => {
    const pid = Number(card.dataset.produto);
    if (!pid) return;

    const actions = card.querySelector('.product-card__actions');
    if (!actions || actions.querySelector('.btn-fav')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-fav' + (ids.has(pid) ? ' btn-fav--active' : '');
    btn.dataset.produto = String(pid);
    btn.setAttribute('aria-label', 'Adicionar aos favoritos');
    btn.innerHTML = HEART_SVG;
    btn.addEventListener('click', (e) => toggleFavorite(e, btn));
    actions.prepend(btn);
  });
};
