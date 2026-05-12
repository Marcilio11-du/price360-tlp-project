import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { toast } from "../components/Toast.js";
import { modal } from "../components/Modal.js";
import { Loader } from "../components/Loader.js";
import { observeNewElements } from "../animations.js";

export default class ShoppingListPage {
  constructor(container) {
    this.container = container;
    this.lists = [];
    this.activeListId = null;
    this.listItems = {};
  }

  async render() {
    if (!auth.isAuthenticated()) {
      router.navigate("/login");
      return;
    }

    this.container.innerHTML = `
      <div class="shopping-list-page page-wrapper container">
        <div class="shopping-list-page__header">
          <h1>As minhas <span style="color:var(--color-primary)">listas</span></h1>
          <button class="btn btn--primary" id="create-list-btn">+ Nova lista</button>
        </div>
        <div class="list-tabs" id="list-tabs"></div>
        <div id="list-content">${Loader.render()}</div>
      </div>
    `;

    await this.loadLists();
    this.bindEvents();
    observeNewElements();
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
          ${list.nome}
        </div>
      `,
        )
        .join("") +
      `<div class="list-tab" id="new-tab-btn" style="border-style:dashed">+ Nova</div>`;

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
      content.innerHTML = `
        <div class="list-card">
          <div class="list-card__header">
            <h3>${list?.nome || "Lista"}</h3>
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn--outline btn--sm" id="edit-list-btn">Editar</button>
              <button class="btn btn--danger btn--sm" id="delete-list-btn">Eliminar</button>
            </div>
          </div>
          <div class="list-empty">
            <span class="list-empty__icon">+</span>
            <h3>Lista vazia</h3>
            <p>Adiciona produtos navegando pela página de produtos!</p>
            <a href="#/produtos" class="btn btn--primary" style="margin-top:16px;display:inline-block">Explorar produtos</a>
          </div>
        </div>`;

      content
        .querySelector("#edit-list-btn")
        ?.addEventListener("click", () => this.openEditModal(list));
      content
        .querySelector("#delete-list-btn")
        ?.addEventListener("click", () => this.deleteList(listId));
      return;
    }

    content.innerHTML = `
      <div class="list-card animate-scroll">
        <div class="list-card__header">
          <h3>${list?.nome || "Lista"}</h3>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn--outline btn--sm" id="edit-list-btn">Editar</button>
            <button class="btn btn--danger btn--sm" id="delete-list-btn">Eliminar</button>
          </div>
        </div>
        <div class="list-card__items">
          ${items
            .map(
              (item) => `
            <div class="list-item animate-scroll" data-item-id="${item.id}">
              <div class="list-item__check" data-check></div>
              <div class="list-item__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <path d="M9 12h6M12 9v6"/>
                </svg>
              </div>
              <div class="list-item__info">
                <div class="list-item__name">${item.produto_nome}</div>
                <div class="list-item__store">${item.lista_nome || ""}</div>
              </div>
              <button class="list-item__remove" data-item="${item.id}" aria-label="Remover">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="list-card__footer">
          <span class="list-card__count">${items.length} produto${items.length !== 1 ? "s" : ""}</span>
          <a href="#/produtos" class="btn btn--primary btn--sm">+ Adicionar produtos</a>
        </div>
      </div>
    `;

    // Toggle de checkbox (visual)
    content.querySelectorAll("[data-check]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        e.target.classList.toggle("checked");
        e.target.closest(".list-item")?.classList.toggle("list-item--checked");
      });
    });

    content.querySelectorAll(".list-item__remove").forEach((btn) => {
      btn.addEventListener("click", () =>
        this.removeItem(Number(btn.dataset.item), listId),
      );
    });

    content
      .querySelector("#edit-list-btn")
      ?.addEventListener("click", () => this.openEditModal(list));
    content
      .querySelector("#delete-list-btn")
      ?.addEventListener("click", () => this.deleteList(listId));

    observeNewElements();
  }

  async removeItem(itemId, listId) {
    try {
      await api.delete(`/product-shopping-lists/${itemId}`);
      toast.success("Produto removido da lista.");
      await this.loadListItems(listId);
    } catch {
      toast.error("Erro ao remover produto.");
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
        const descricao = document
          .querySelector("#edit-list-desc")
          .value.trim();
        if (!nome) {
          toast.error("O nome é obrigatório.");
          return;
        }
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
    content.innerHTML = `
      <div class="lists-empty-state">
        <span class="lists-empty-state__icon">0</span>
        <h2>Ainda não tens listas</h2>
        <p>Cria a tua primeira lista de compras e começa a comparar preços!</p>
        <button class="btn btn--primary" id="create-first-list">Criar primeira lista</button>
      </div>
    `;
    content
      .querySelector("#create-first-list")
      ?.addEventListener("click", () => this.openCreateModal());
  }

  openCreateModal() {
    const user = auth.getUser();
    modal.open({
      title: "Nova lista de compras",
      body: `
        <div class="form-group">
          <label>Nome da lista *</label>
          <input type="text" id="new-list-name" placeholder="Ex: Compras do mês" />
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
        if (!nome) {
          toast.error("O nome é obrigatório.");
          return;
        }
        try {
          await api.post("/shopping-lists", {
            nome,
            descricao,
            id_cliente: user.id,
          });
          toast.success("Lista criada com sucesso!");
          modal.close();
          await this.loadLists();
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
  }
}

// ─── Exportada para uso nas páginas de produtos ───────────────────────────────
export const openAddToListModal = async (productId) => {
  const user = auth.getUser();
  if (!user) {
    router.navigate("/login");
    return;
  }

  try {
    const res = await api.get(`/shopping-lists/client/${user.id}`);
    const lists = res.data || [];

    if (lists.length === 0) {
      toast.info("Primeiro cria uma lista de compras!");
      router.navigate("/lista");
      return;
    }

    modal.open({
      title: "Adicionar à lista",
      body: `
        <p style="margin-bottom:1rem;color:var(--color-gray-600)">
          Escolhe a lista onde queres adicionar este produto:
        </p>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          ${lists
            .map(
              (l) => `
            <button class="btn btn--outline"
              style="text-align:left;justify-content:flex-start"
              data-list-id="${l.id}">
              Lista: ${l.nome}
            </button>
          `,
            )
            .join("")}
        </div>
      `,
      confirmText: null,
    });

    setTimeout(() => {
      document.querySelectorAll("[data-list-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await api.post("/product-shopping-lists", {
              id_lista: Number(btn.dataset.listId),
              id_produto: Number(productId),
            });
            toast.success("Produto adicionado à lista!");
            modal.close();
          } catch (err) {
            toast.error(err.message || "Erro ao adicionar produto.");
          }
        });
      });
    }, 100);
  } catch {
    toast.error("Erro ao carregar listas.");
  }
};
