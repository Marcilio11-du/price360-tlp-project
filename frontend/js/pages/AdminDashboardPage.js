import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { toast } from "../components/Toast.js";
import { modal } from "../components/Modal.js";
import { Loader } from "../components/Loader.js";
import { observeNewElements } from "../animations.js";

const SECTIONS = [
  "overview",
  "produtos",
  "categorias",
  "lojas",
  "utilizadores",
];

const SECTION_ICONS = {
  overview: "OV",
  produtos: "PR",
  categorias: "CT",
  lojas: "LJ",
  utilizadores: "US",
};

export default class AdminDashboardPage {
  constructor(container) {
    this.container = container;
    this.activeSection = "overview";
    this.data = {};
  }

  async render() {
    if (!auth.isAdmin()) {
      router.navigate("/");
      return;
    }

    this.container.innerHTML = `
      <div class="admin-layout page-wrapper">
        <aside class="admin-sidebar">
          <div class="admin-sidebar__brand"><h2>Admin</h2></div>
          <nav>
            ${SECTIONS.map(
              (s) => `
              <div class="admin-sidebar__item ${s === this.activeSection ? "admin-sidebar__item--active" : ""}"
                data-section="${s}">
                ${SECTION_ICONS[s]}
                ${s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            `,
            ).join("")}
          </nav>
        </aside>
        <main class="admin-main" id="admin-main">
          ${Loader.render()}
        </main>
      </div>
    `;

    this.container.querySelectorAll(".admin-sidebar__item").forEach((item) => {
      item.addEventListener("click", () => {
        this.activeSection = item.dataset.section;
        this.container
          .querySelectorAll(".admin-sidebar__item")
          .forEach((i) => i.classList.remove("admin-sidebar__item--active"));
        item.classList.add("admin-sidebar__item--active");
        this.renderSection();
      });
    });

    await this.renderSection();
    observeNewElements();
  }

  async renderSection() {
    const main = this.container.querySelector("#admin-main");
    if (!main) return;
    main.innerHTML = Loader.render();

    switch (this.activeSection) {
      case "overview":
        await this.renderOverview(main);
        break;
      case "produtos":
        await this.renderTable(
          main,
          "produtos",
          "/products/all",
          ["id", "nome", "marca", "categoria_nome"],
          ["id", "Nome", "Marca", "Categoria"],
        );
        break;
      case "categorias":
        await this.renderTable(
          main,
          "categorias",
          "/categories/all",
          ["id", "nome", "descricao"],
          ["id", "Nome", "Descrição"],
        );
        break;
      case "lojas":
        await this.renderTable(
          main,
          "lojas",
          "/stores/all",
          ["id", "nome", "nif", "municipio", "email"],
          ["id", "Nome", "NIF", "Município", "Email"],
        );
        break;
      case "utilizadores":
        await this.renderTable(
          main,
          "utilizadores",
          "/users/all",
          ["id", "p_nome", "u_nome", "email", "role"],
          ["id", "Primeiro nome", "Último nome", "Email", "Role"],
        );
        break;
    }
    observeNewElements();
  }

  async renderOverview(main) {
    try {
      const [users, products, stores, categories] = await Promise.all([
        api.get("/users"),
        api.get("/products"),
        api.get("/stores"),
        api.get("/categories"),
      ]);

      main.innerHTML = `
        <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:1.5rem">Visão Geral</h2>
        <div class="admin-stats">
          <div class="stat-card animate-scroll">
            <div class="stat-card__value">${(users.data || []).length}</div>
            <div class="stat-card__label">Utilizadores activos</div>
          </div>
          <div class="stat-card animate-scroll">
            <div class="stat-card__value">${(products.data || []).length}</div>
            <div class="stat-card__label">Produtos activos</div>
          </div>
          <div class="stat-card animate-scroll">
            <div class="stat-card__value">${(stores.data || []).length}</div>
            <div class="stat-card__label">Lojas activas</div>
          </div>
          <div class="stat-card animate-scroll">
            <div class="stat-card__value">${(categories.data || []).length}</div>
            <div class="stat-card__label">Categorias activas</div>
          </div>
        </div>
        <div class="admin-section animate-scroll" style="margin-top:1.5rem">
          <div class="admin-section__header">
            <h3>Acesso rápido</h3>
          </div>
          <div style="padding:1.5rem;display:flex;gap:1rem;flex-wrap:wrap">
            ${SECTIONS.filter((s) => s !== "overview")
              .map(
                (s) => `
              <button class="btn btn--outline" data-goto="${s}">
                Gerir ${s}
              </button>
            `,
              )
              .join("")}
          </div>
        </div>
      `;

      main.querySelectorAll("[data-goto]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.activeSection = btn.dataset.goto;
          this.container
            .querySelectorAll(".admin-sidebar__item")
            .forEach((i) => {
              i.classList.toggle(
                "admin-sidebar__item--active",
                i.dataset.section === this.activeSection,
              );
            });
          this.renderSection();
        });
      });
    } catch {
      main.innerHTML =
        '<p style="padding:2rem;color:#757575">Erro ao carregar dados.</p>';
    }
  }

  async renderTable(main, section, endpoint, fields, headers) {
    try {
      const res = await api.get(endpoint);
      const rows = res.data || [];

      main.innerHTML = `
        <div class="admin-section animate-scroll">
          <div class="admin-section__header">
            <h3>${section.charAt(0).toUpperCase() + section.slice(1)}</h3>
          </div>
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  ${headers.map((h) => `<th>${h}</th>`).join("")}
                  <th>Estado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (row) => `
                  <tr>
                    ${fields.map((f) => `<td>${row[f] ?? "—"}</td>`).join("")}
                    <td>
                      <span class="admin-badge ${row.deleted_at ? "admin-badge--deleted" : "admin-badge--active"}">
                        ${row.deleted_at ? "Inativo" : "Ativo"}
                      </span>
                    </td>
                    <td>
                      <div class="admin-actions">
                        ${
                          !row.deleted_at
                            ? `
                          <button class="btn btn--outline btn--sm"
                            data-action="edit" data-id="${row.id}">
                            Editar
                          </button>
                          <button class="btn btn--danger btn--sm"
                            data-action="delete" data-id="${row.id}">
                            Eliminar
                          </button>
                        `
                            : `
                          <button class="btn btn--outline btn--sm"
                            data-action="restore" data-id="${row.id}">
                            Restaurar
                          </button>
                        `
                        }
                      </div>
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      const baseEndpoint = endpoint.replace("/all", "");

      // ── Eliminar ────────────────────────────────────────────────────────────
      main.querySelectorAll('[data-action="delete"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          modal.open({
            title: "Confirmar eliminação",
            body: `<p>Tens a certeza que queres eliminar este registo (id: <strong>${id}</strong>)?</p>`,
            confirmText: "Eliminar",
            onConfirm: async () => {
              try {
                await api.delete(`${baseEndpoint}/${id}`);
                toast.success("Registo eliminado.");
                modal.close();
                await this.renderTable(
                  main,
                  section,
                  endpoint,
                  fields,
                  headers,
                );
              } catch (err) {
                toast.error(err.message || "Erro ao eliminar.");
              }
            },
          });
        });
      });

      // ── Restaurar ───────────────────────────────────────────────────────────
      main.querySelectorAll('[data-action="restore"]').forEach((btn) => {
        btn.addEventListener("click", async () => {
          try {
            await api.put(`${baseEndpoint}/${btn.dataset.id}/restore`, {});
            toast.success("Registo restaurado.");
            await this.renderTable(main, section, endpoint, fields, headers);
          } catch (err) {
            toast.error(err.message || "Erro ao restaurar.");
          }
        });
      });

      // ── Editar ──────────────────────────────────────────────────────────────
      main.querySelectorAll('[data-action="edit"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const row = rows.find((r) => String(r.id) === String(id));
          if (!row) return;
          const editableFields = fields.filter((f) => f !== "id");
          modal.open({
            title: `Editar registo #${id}`,
            body: editableFields
              .map(
                (f) => `
              <div class="form-group">
                <label>${headers[fields.indexOf(f)]}</label>
                <input type="text" id="edit-field-${f}" value="${row[f] ?? ""}" />
              </div>
            `,
              )
              .join(""),
            confirmText: "Guardar alterações",
            onConfirm: async () => {
              const payload = {};
              editableFields.forEach((f) => {
                payload[f] =
                  document.querySelector(`#edit-field-${f}`)?.value.trim() ??
                  "";
              });
              try {
                await api.put(`${baseEndpoint}/${id}`, payload);
                toast.success("Registo actualizado.");
                modal.close();
                await this.renderTable(
                  main,
                  section,
                  endpoint,
                  fields,
                  headers,
                );
              } catch (err) {
                toast.error(err.message || "Erro ao actualizar.");
              }
            },
          });
        });
      });
    } catch {
      main.innerHTML =
        '<p style="padding:2rem;color:#757575">Erro ao carregar dados.</p>';
    }
  }
}
