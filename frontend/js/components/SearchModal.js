/**
 * @file components/SearchModal.js
 * @description Modal de pesquisa global (Xé Preço). Abre sobre a navbar,
 * mostra sugestões em tempo real enquanto o utilizador digita e permite
 * navegar por teclado (↑ ↓ Enter Esc). Enter sem selecção → /produtos?q=.
 */

import { api } from '../api.js';
import { router } from '../router.js';
import { toast } from './Toast.js';
import { formatPrice, debounce, truncate, productImgHtml } from '../utils.js';

const CLOSE_DURATION = 260;
const MIN_CHARS = 2;
const MAX_SUGGESTIONS = 8;

let root = null;
let overlay = null;
let input = null;
let resultsEl = null;
let items = [];
let selectedIndex = -1;
let abortController = null;

const getRoot = () => {
  if (!root) root = document.getElementById('modal-root');
  return root;
};

const resultRow = (sp, index) => {
  const preco = Number.isFinite(Number(sp.preco_min)) ? Number(sp.preco_min) : null;
  const lojas = Number(sp.total_lojas) || 0;
  return `
    <button type="button" class="search-modal__item ${index === selectedIndex ? 'is-selected' : ''}"
            data-index="${index}" data-id="${sp.id}">
      <span class="search-modal__thumb">${productImgHtml(sp.imagem, sp.nome)}</span>
      <span class="search-modal__info">
        <span class="search-modal__name">${truncate(sp.nome || 'Produto', 58)}</span>
        <span class="search-modal__meta">
          ${preco !== null ? `<strong>${formatPrice(preco)}</strong>` : '<em>Preço indisponível</em>'}
          <span class="search-modal__dot">•</span>
          ${lojas} loja${lojas !== 1 ? 's' : ''}
        </span>
      </span>
      <svg class="search-modal__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </button>`;
};

const renderResults = () => {
  if (!resultsEl) return;

  if (!items.length) {
    const q = input?.value.trim() || '';
    resultsEl.innerHTML =
      q.length >= MIN_CHARS
        ? `<div class="search-modal__empty">Nenhum produto encontrado para <strong>“${truncate(q, 30)}”</strong>.</div>`
        : `<div class="search-modal__empty search-modal__empty--hint">
             <span class="search-modal__hint-icon">⌕</span>
             Escreve o nome de um produto — ex.: <em>iPhone</em>, <em>arroz</em>, <em>ventilador</em>…
           </div>`;
    return;
  }

  resultsEl.innerHTML =
    items.map((sp, i) => resultRow(sp, i)).join('') +
    `
    <a href="#/produtos?q=${encodeURIComponent(input.value.trim())}"
       class="search-modal__all ${selectedIndex === items.length ? 'is-selected' : ''}"
       data-index="${items.length}">
      Ver todos os resultados
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M5 12h14m-6-6 6 6-6 6"/>
      </svg>
    </a>`;
};

const setSelected = (index) => {
  if (!resultsEl) return;
  const total = items.length + 1; // + link "ver todos"
  if (total === 0) return;
  selectedIndex = ((index % total) + total) % total;
  resultsEl.querySelectorAll('.search-modal__item, .search-modal__all').forEach((el) => {
    el.classList.toggle('is-selected', Number(el.dataset.index) === selectedIndex);
  });
  const selected = resultsEl.querySelector('.is-selected');
  selected?.scrollIntoView({ block: 'nearest' });
};

const go = (index) => {
  close();
  if (index >= 0 && index < items.length) {
    router.navigate(`/produto?id=${items[index].id}`);
  } else {
    router.navigate(`/produtos?q=${encodeURIComponent(input?.value.trim() || '')}`);
  }
};

const fetchSuggestions = async () => {
  const q = input?.value.trim() || '';
  if (q.length < MIN_CHARS) {
    items = [];
    renderResults();
    return;
  }

  abortController?.abort();
  abortController = new AbortController();

  resultsEl.innerHTML = `<div class="search-modal__loading"><span class="spinner"></span>A procurar…</div>`;

  try {
    const res = await api.get(
      `/store-products/grouped?q=${encodeURIComponent(q)}`,
      { signal: abortController.signal },
    );
    // Só sugere produtos efectivamente compráveis
    items = (res.data || [])
      .filter((sp) => Number(sp.total_lojas) > 0 && Number(sp.preco_min) > 0)
      .slice(0, MAX_SUGGESTIONS);
    selectedIndex = -1;
    renderResults();
  } catch (error) {
    if (error.name === 'AbortError') return;
    items = [];
    renderResults();
    toast.error('Não foi possível procurar agora.');
  }
};

const onKeyDown = (e) => {
  if (e.key === 'Escape') {
    close();
    return;
  }
  const total = items.length + 1;
  if (!total) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(selectedIndex + 1); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(selectedIndex - 1); }
  if (e.key === 'Enter')     { e.preventDefault(); go(selectedIndex); }
};

export function openSearchModal(initialQuery = '') {
  const mount = getRoot();
  if (!mount) return;

  mount.innerHTML = `
    <div class="modal-overlay search-overlay" id="search-overlay">
      <div class="search-modal" role="dialog" aria-label="Pesquisar produtos">
        <div class="search-modal__bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" id="search-modal-input" class="search-modal__input"
                 placeholder="Que produto procuras hoje?" autocomplete="off" spellcheck="false"/>
          <kbd class="search-modal__esc">Esc</kbd>
        </div>
        <div class="search-modal__results" id="search-modal-results"></div>
        <div class="search-modal__footer">↑↓ para navegar · Enter para abrir</div>
      </div>
    </div>`;

  overlay = mount.querySelector('#search-overlay');
  input = mount.querySelector('#search-modal-input');
  resultsEl = mount.querySelector('#search-modal-results');
  items = [];
  selectedIndex = -1;

  overlay.getBoundingClientRect(); // flush → transição de entrada
  overlay.classList.add('modal--open');

  const debouncedFetch = debounce(fetchSuggestions, 250);
  input.addEventListener('input', debouncedFetch);
  document.addEventListener('keydown', onKeyDown);
  resultsEl.addEventListener('click', (e) => {
    const row = e.target.closest('[data-index]');
    if (row) go(Number(row.dataset.index));
  });
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === e.currentTarget) close();
  });

  if (initialQuery) input.value = initialQuery;
  renderResults();
  requestAnimationFrame(() => input.focus());
}

export function close() {
  abortController?.abort();
  abortController = null;
  document.removeEventListener('keydown', onKeyDown);
  if (!overlay) return;
  const el = overlay;
  overlay = null;
  el.classList.remove('modal--open');
  el.classList.add('modal--closing');
  setTimeout(() => {
    el.remove();
  }, CLOSE_DURATION);
}
