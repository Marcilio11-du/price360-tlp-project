import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { toast } from "../components/Toast.js";
import { modal } from "../components/Modal.js";
import { Loader } from "../components/Loader.js";
import { observeNewElements } from "../animations.js";

// ─── Estado pendente de produto (persistido via sessionStorage) ───────────────
const PENDING_KEY = "price360_pending_product";

export const setPendingProduct = (productId, productName) => {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify({ id: productId, name: productName }));
};

const getPendingProduct = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const clearPendingProduct = () => sessionStorage.removeItem(PENDING_KEY);

// ─── Classe principal ─────────────────────────────────────────────────────────
export default class ShoppingListPage {
  constructor(container) {
    this.container = container;
    this.lists = [];
    this.activeListId = null;
    this.listItems = {};
    // Mapa de quantidades locais: { itemId: qty }
    this.quantities = {};
  }

  async render() {
    if (!auth.isAuthenticated()) {
      router.navigate("/login");
      return;
    }

    this.container.innerHTML = `
      <div class="shopping-list-page page-wrapper container">
        <div class="shopping-list-page__header">
          <div>
            <h1>As minhas <span>listas</span></h1>
            <p class="shopping-list-page__subtitle">Organiza as tuas compras e compara preços</p>
          </div>
          <button class="btn btn--primary sl-btn-new" id="create-list-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova lista
          </button>
        </div>
        <div class="list-tabs" id="list-tabs"></div>
        <div id="list-content">${Loader.render()}</div>
      </div>
      <div class="sl-sticky-footer" id="sl-sticky-footer" style="display:none">
        <div class="sl-sticky-footer__inner container">
          <div class="sl-sticky-footer__summary">
            <span class="sl-sticky-footer__label">Total estimado</span>
            <span class="sl-sticky-footer__total" id="footer-total">—</span>
          </div>
          <button class="btn sl-sticky-footer__compare" id="footer-compare-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            Comparar Lojas
          </button>
        </div>
      </div>
    `;

    await this.loadLists();
    this.bindEvents();
    observeNewElements();

    // ─── Verificar produto pendente após renderização ─────────────────────
    const pending = getPendingProduct();
    if (pending) {
      this._handlePendingProduct(pending);
    }
  }

  // ─── Produto pendente: perguntar ao utilizador se quer adicionar ──────────
  _handlePendingProduct(pending) {
    if (this.lists.length === 0) return; // ainda sem listas — não faz nada aqui

    clearPendingProduct();

    // Mostrar modal a perguntar se quer adicionar à lista activa
    const activeList = this.lists.find(l => l.id === this.activeListId);

    modal.open({
      title: "✅ Lista criada com sucesso!",
      body: `
        <div class="pending-product-modal">
          <div class="pending-product-modal__product">
            <div class="pending-product-modal__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M9 12h6M12 9v6"/>
              </svg>
            </div>
            <div>
              <div class="pending-product-modal__name">${pending.name}</div>
              <div class="pending-product-modal__hint">Deseja adicionar este produto à lista <strong>"${activeList?.nome || 'actual'}"</strong>?</div>
            </div>
          </div>
        </div>
      `,
      confirmText: "Sim, adicionar!",
      cancelText: "Agora não",
      onConfirm: async () => {
        try {
          await api.post("/product-shopping-lists", {
            id_lista: this.activeListId,
            id_produto: Number(pending.id),
          });
          toast.success(`${pending.name} adicionado à lista!`);
          modal.close();
          await this.loadListItems(this.activeListId);
        } catch (err) {
          if (err.status === 409) {
            toast.info("Este produto já está na lista!");
            modal.close();
          } else {
            toast.error(err.message || "Erro ao adicionar produto.");
          }
        }
      },
    });
  }

  async loadLists() {
    try {
      const user = auth.getUser();
      const res = await api.get(`/shopping-lists/client/${user.id}`);
      this.lists = res.data || [];
      this.renderTabs();
      if (this.lists.length > 0) {
        this.activeListId = this.lists[0].id;
        await this.loadListItems(this.activeListId);
      } else {
        this.renderEmptyState();
      }
    } catch {
      toast.error("Erro ao carregar listas.");
    }
  }

  renderTabs() {
    const tabs = this.container.querySelector("#list-tabs");
    if (!tabs) return;

    tabs.innerHTML =
      this.lists
        .map(
          (list) => `
        <div class="list-tab ${list.id === this.activeListId ? "list-tab--active" : ""}"
             data-id="${list.id}">
          <span class="list-tab__dot"></span>
          ${list.nome}
        </div>
      `,
        )
        .join("") +
      `<div class="list-tab list-tab--new" id="new-tab-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova
      </div>`;

    tabs.querySelectorAll(".list-tab[data-id]").forEach((tab) => {
      tab.addEventListener("click", async () => {
        this.activeListId = Number(tab.dataset.id);
        tabs
          .querySelectorAll(".list-tab")
          .forEach((t) => t.classList.remove("list-tab--active"));
        tab.classList.add("list-tab--active");
        await this.loadListItems(this.activeListId);
      });
    });

    tabs
      .querySelector("#new-tab-btn")
      ?.addEventListener("click", () => this.openCreateModal());
  }

  async loadListItems(listId) {
    const content = this.container.querySelector("#list-content");
    if (!content) return;
    content.innerHTML = Loader.render();
    try {
      const res = await api.get(`/product-shopping-lists/list/${listId}`);
      const items = res.data || [];
      this.listItems[listId] = items;
      // Inicializar quantidades locais para itens novos
      items.forEach(item => {
        if (!this.quantities[item.id]) this.quantities[item.id] = 1;
      });
      this.renderListContent(listId, items);
    } catch {
      content.innerHTML =
        '<p style="color:var(--color-gray-600);padding:2rem">Erro ao carregar itens.</p>';
    }
  }

  renderListContent(listId, items) {
    const content = this.container.querySelector("#list-content");
    if (!content) return;
    const list = this.lists.find((l) => l.id === listId);

    if (items.length === 0) {
      this._hideStickyFooter();
      content.innerHTML = `
        <div class="list-card">
          <div class="list-card__header">
            <div class="list-card__header-left">
              <div class="list-card__avatar">${(list?.nome || "L")[0].toUpperCase()}</div>
              <h3>${list?.nome || "Lista"}</h3>
            </div>
            <div class="list-card__header-actions">
              <button class="btn btn--outline btn--sm" id="edit-list-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar
              </button>
              <button class="btn btn--danger btn--sm" id="delete-list-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                Eliminar
              </button>
            </div>
          </div>
          <div class="list-empty">
            <div class="list-empty__illustration">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <h3>Lista vazia</h3>
            <p>Adiciona produtos navegando pela página de produtos!</p>
            <a href="#/produtos" class="btn btn--primary" style="margin-top:16px;display:inline-flex;align-items:center;gap:8px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Explorar produtos
            </a>
          </div>
        </div>`;

      content.querySelector("#edit-list-btn")?.addEventListener("click", () => this.openEditModal(list));
      content.querySelector("#delete-list-btn")?.addEventListener("click", () => this.deleteList(listId));
      return;
    }

    content.innerHTML = `
      <div class="list-card animate-scroll">
        <div class="list-card__header">
          <div class="list-card__header-left">
            <div class="list-card__avatar">${(list?.nome || "L")[0].toUpperCase()}</div>
            <div>
              <h3>${list?.nome || "Lista"}</h3>
              <span class="list-card__meta">${items.length} produto${items.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div class="list-card__header-actions">
            <button class="btn btn--outline btn--sm" id="edit-list-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button class="btn btn--danger btn--sm" id="delete-list-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              Eliminar
            </button>
          </div>
        </div>
        <div class="list-card__items" id="list-items-container">
          ${items.map((item) => this._renderItem(item)).join("")}
        </div>
        <div class="list-card__footer">
          <a href="#/produtos" class="btn btn--ghost btn--sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar mais produtos
          </a>
        </div>
      </div>
    `;

    this._bindItemEvents(content, listId, items);
    this._updateStickyFooter(items);
    content.querySelector("#edit-list-btn")?.addEventListener("click", () => this.openEditModal(list));
    content.querySelector("#delete-list-btn")?.addEventListener("click", () => this.deleteList(listId));
    observeNewElements();
  }

  _renderItem(item) {
    const qty = this.quantities[item.id] || 1;
    return `
      <div class="list-item animate-scroll" data-item-id="${item.id}">
        <div class="list-item__check" data-check></div>
        <div class="list-item__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M9 12h6M12 9v6"/>
          </svg>
        </div>
        <div class="list-item__info">
          <div class="list-item__name">${item.produto_nome}</div>
          <div class="list-item__store">${item.lista_nome || ""}</div>
        </div>
        <div class="list-item__qty-control">
          <button class="qty-btn qty-btn--minus" data-item="${item.id}" aria-label="Diminuir quantidade" ${qty <= 1 ? "disabled" : ""}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <span class="qty-value" data-item-qty="${item.id}">${qty}</span>
          <button class="qty-btn qty-btn--plus" data-item="${item.id}" aria-label="Aumentar quantidade">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <button class="list-item__remove" data-item="${item.id}" aria-label="Remover">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }

  _bindItemEvents(content, listId, items) {
    // Checkboxes
    content.querySelectorAll("[data-check]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        el.classList.toggle("checked");
        el.closest(".list-item")?.classList.toggle("list-item--checked");
      });
    });

    // Botões qty -
    content.querySelectorAll(".qty-btn--minus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.item);
        if (this.quantities[id] > 1) {
          this.quantities[id]--;
          this._refreshItemQty(content, id, items);
        }
      });
    });

    // Botões qty +
    content.querySelectorAll(".qty-btn--plus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.item);
        this.quantities[id] = (this.quantities[id] || 1) + 1;
        this._refreshItemQty(content, id, items);
      });
    });

    // Remover
    content.querySelectorAll(".list-item__remove").forEach((btn) => {
      btn.addEventListener("click", () =>
        this.removeItem(Number(btn.dataset.item), listId),
      );
    });
  }

  _refreshItemQty(content, itemId, items) {
    const qty = this.quantities[itemId];
    const qtyEl = content.querySelector(`[data-item-qty="${itemId}"]`);
    const minusBtn = content.querySelector(`.qty-btn--minus[data-item="${itemId}"]`);

    if (qtyEl) {
      qtyEl.textContent = qty;
      // Animação visual
      qtyEl.classList.remove("qty-pulse");
      void qtyEl.offsetWidth;
      qtyEl.classList.add("qty-pulse");
    }
    if (minusBtn) minusBtn.disabled = qty <= 1;

    this._updateStickyFooter(items);
  }

  _updateStickyFooter(items) {
    const footer = document.getElementById("sl-sticky-footer");
    const totalEl = document.getElementById("footer-total");
    if (!footer) return;

    if (!items || items.length === 0) {
      this._hideStickyFooter();
      return;
    }

    footer.style.display = "";
    // Usar um pequeno delay para a animação de entrada
    requestAnimationFrame(() => footer.classList.add("sl-sticky-footer--visible"));

    // Calcular total com base nas quantidades locais
    // (sem preços na lista, mostramos contagem total)
    const totalQty = items.reduce((sum, item) => sum + (this.quantities[item.id] || 1), 0);
    if (totalEl) {
      totalEl.textContent = `${totalQty} unidade${totalQty !== 1 ? "s" : ""}`;
    }
  }

  _hideStickyFooter() {
    const footer = document.getElementById("sl-sticky-footer");
    if (footer) {
      footer.classList.remove("sl-sticky-footer--visible");
      setTimeout(() => { footer.style.display = "none"; }, 300);
    }
  }

  async removeItem(itemId, listId) {
    // Animação de saída antes de remover
    const itemEl = this.container.querySelector(`[data-item-id="${itemId}"]`);
    if (itemEl) {
      itemEl.classList.add("list-item--removing");
      await new Promise(r => setTimeout(r, 260));
    }
    try {
      await api.delete(`/product-shopping-lists/${itemId}`);
      delete this.quantities[itemId];
      toast.success("Produto removido da lista.");
      await this.loadListItems(listId);
    } catch {
      toast.error("Erro ao remover produto.");
      if (itemEl) itemEl.classList.remove("list-item--removing");
    }
  }

  openEditModal(list) {
    modal.open({
      title: "Editar lista",
      body: `
        <div class="form-group">
          <label>Nome da lista</label>
          <input type="text" id="edit-list-name" value="${list.nome}" />
        </div>
        <div class="form-group">
          <label>Descrição (opcional)</label>
          <textarea id="edit-list-desc">${list.descricao || ""}</textarea>
        </div>
      `,
      confirmText: "Guardar alterações",
      onConfirm: async () => {
        const nome = document.querySelector("#edit-list-name").value.trim();
        const descricao = document.querySelector("#edit-list-desc").value.trim();
        if (!nome) { toast.error("O nome é obrigatório."); return; }
        try {
          await api.put(`/shopping-lists/${list.id}`, { nome, descricao });
          toast.success("Lista actualizada!");
          modal.close();
          await this.loadLists();
        } catch {
          toast.error("Erro ao actualizar lista.");
        }
      },
    });
  }

  async deleteList(listId) {
    modal.open({
      title: "Eliminar lista",
      body: "<p>Tens a certeza que queres eliminar esta lista? Esta acção não pode ser desfeita.</p>",
      confirmText: "Eliminar",
      onConfirm: async () => {
        try {
          await api.delete(`/shopping-lists/${listId}`);
          toast.success("Lista eliminada.");
          modal.close();
          this._hideStickyFooter();
          await this.loadLists();
        } catch {
          toast.error("Erro ao eliminar lista.");
        }
      },
    });
  }

  renderEmptyState() {
    const content = this.container.querySelector("#list-content");
    if (!content) return;
    this._hideStickyFooter();
    content.innerHTML = `
      <div class="lists-empty-state">
        <div class="lists-empty-state__illustration">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </div>
        <h2>Ainda não tens listas</h2>
        <p>Cria a tua primeira lista de compras e começa a comparar preços entre lojas!</p>
        <button class="btn btn--primary" id="create-first-list">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Criar primeira lista
        </button>
      </div>
    `;
    const pending = getPendingProduct();
    content.querySelector("#create-first-list")?.addEventListener("click", () => {
      this.openCreateModal(pending ? () => this._handlePendingProduct(pending) : null);
    });
  }

  openCreateModal(afterCreate = null) {
    const user = auth.getUser();
    modal.open({
      title: "Nova lista de compras",
      body: `
        <div class="form-group">
          <label>Nome da lista *</label>
          <input type="text" id="new-list-name" placeholder="Ex: Compras do mês" autofocus />
        </div>
        <div class="form-group">
          <label>Descrição (opcional)</label>
          <textarea id="new-list-desc" placeholder="Descrição..."></textarea>
        </div>
      `,
      confirmText: "Criar lista",
      onConfirm: async () => {
        const nome = document.querySelector("#new-list-name").value.trim();
        const descricao = document.querySelector("#new-list-desc").value.trim();
        if (!nome) { toast.error("O nome é obrigatório."); return; }
        try {
          const res = await api.post("/shopping-lists", { nome, descricao, id_cliente: user.id });
          modal.close();
          await this.loadLists();
          if (afterCreate) {
            // Activar a lista recém-criada
            const newList = res.data;
            if (newList?.id) {
              this.activeListId = newList.id;
              this.container.querySelectorAll(".list-tab[data-id]").forEach(t => {
                t.classList.toggle("list-tab--active", Number(t.dataset.id) === newList.id);
              });
              await this.loadListItems(newList.id);
            }
            afterCreate();
          } else {
            toast.success("Lista criada com sucesso!");
          }
        } catch (err) {
          toast.error(err.message || "Erro ao criar lista.");
        }
      },
    });
  }

  bindEvents() {
    this.container
      .querySelector("#create-list-btn")
      ?.addEventListener("click", () => this.openCreateModal());

    document.getElementById("footer-compare-btn")?.addEventListener("click", () => {
      toast.info("Funcionalidade de comparação em breve!");
    });
  }
}

// ─── Exportada para uso nas páginas de produtos ───────────────────────────────
export const openAddToListModal = async (productId, productName = "Produto") => {
  const user = auth.getUser();
  if (!user) {
    router.navigate("/login");
    return;
  }

  try {
    const res = await api.get(`/shopping-lists/client/${user.id}`);
    const lists = res.data || [];

    // ── Sem listas: guardar produto pendente e ir criar uma ────────────────
    if (lists.length === 0) {
      setPendingProduct(productId, productName);
      toast.info("Primeiro cria uma lista de compras!");
      router.navigate("/lista");
      return;
    }

    // ── Com listas: mostrar picker ────────────────────────────────────────
    modal.open({
      title: "Adicionar à lista",
      body: `
        <p class="modal-subtitle">Escolhe a lista onde queres adicionar este produto:</p>
        <div class="list-picker">
          ${lists.map((l) => `
            <button class="list-picker__item" data-list-id="${l.id}">
              <div class="list-picker__avatar">${l.nome[0].toUpperCase()}</div>
              <span>${l.nome}</span>
              <svg class="list-picker__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          `).join("")}
        </div>
        <button class="btn btn--ghost btn--sm" id="modal-new-list-btn" style="width:100%;margin-top:8px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Criar nova lista
        </button>
      `,
      confirmText: null,
    });

    setTimeout(() => {
      document.querySelectorAll("[data-list-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.classList.add("list-picker__item--loading");
          try {
            await api.post("/product-shopping-lists", {
              id_lista: Number(btn.dataset.listId),
              id_produto: Number(productId),
            });
            toast.success("Produto adicionado à lista!");
            modal.close();
          } catch (err) {
            if (err.status === 409) {
              toast.info("Este produto já está nessa lista!");
              modal.close();
            } else {
              toast.error(err.message || "Erro ao adicionar produto.");
            }
            btn.classList.remove("list-picker__item--loading");
          }
        });
      });

      // Criar nova lista inline
      document.getElementById("modal-new-list-btn")?.addEventListener("click", () => {
        modal.close();
        setTimeout(() => {
          setPendingProduct(productId, productName);
          router.navigate("/lista");
        }, 300);
      });
    }, 50);
  } catch {
    toast.error("Erro ao carregar listas.");
  }
};