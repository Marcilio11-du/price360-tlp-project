import { api }    from '../api.js';
import { auth }   from '../auth.js';
import { router } from '../router.js';
import { toast }  from '../components/Toast.js';
import { modal }  from '../components/Modal.js';
import { Loader } from '../components/Loader.js';
import { observeNewElements } from '../animations.js';

/* ─── Secções disponíveis na sidebar ──────────────────────────── */
const SECTIONS = [
  { id: 'overview',      label: 'Visão Geral',  icon: '[●]' },
  { id: 'lojas',         label: 'Lojas',         icon: '[●]' },
  { id: 'utilizadores',  label: 'Utilizadores',  icon: '[●]' },
  { id: 'categorias',    label: 'Categorias',    icon: '[●]' },
  { id: 'produtos',      label: 'Produtos',      icon: '[●]' },
  { id: 'logs',          label: 'Logs Scrapers', icon: '[●]' },
];

export default class AdminDashboardPage {
  constructor(container) {
    this.container     = container;
    this.activeSection = 'overview';
  }

  async render() {
    if (!auth.isAdmin()) { router.navigate('/'); return; }

    const user = auth.getUser();

    this.container.innerHTML = `
      <div class="admin-layout page-wrapper">
        <aside class="admin-sidebar">
          <div class="admin-sidebar__brand">
            <h2>Admin</h2>
            <p>${user?.p_nome || user?.email || 'Administrador'}</p>
          </div>
          <nav>
            ${SECTIONS.map(s => `
              <div class="admin-sidebar__item ${s.id === this.activeSection ? 'admin-sidebar__item--active' : ''}"
                   data-section="${s.id}">
                <span>${s.icon}</span> ${s.label}
              </div>
            `).join('')}
          </nav>
        </aside>
        <main class="admin-main" id="admin-main">
          ${Loader.render()}
        </main>
      </div>
    `;

    this.container.querySelectorAll('.admin-sidebar__item').forEach(item => {
      item.addEventListener('click', () => {
        this.activeSection = item.dataset.section;
        this.container.querySelectorAll('.admin-sidebar__item')
          .forEach(i => i.classList.toggle('admin-sidebar__item--active', i.dataset.section === this.activeSection));
        this.renderSection();
      });
    });

    await this.renderSection();
    observeNewElements();
  }

  /* ─────────────────────────────────────────────────────────── */
  async renderSection() {
    const main = this.container.querySelector('#admin-main');
    if (!main) return;
    main.innerHTML = Loader.render();

    switch (this.activeSection) {
      case 'overview':     await this.renderOverview(main);    break;
      case 'lojas':        await this.renderLojas(main);       break;
      case 'utilizadores': await this.renderUtilizadores(main);break;
      case 'categorias':
        await this.renderGenericTable(main, {
          title: 'Categorias', endpoint: '/categories',
          fields: ['id','nome','descricao'], headers: ['ID','Nome','Descrição'],
          editableFields: ['nome','descricao'], editHeaders: ['Nome','Descrição'],
        }); break;
      case 'produtos':
        await this.renderGenericTable(main, {
          title: 'Produtos', endpoint: '/products',
          fields: ['id','nome','marca','categoria_nome'], headers: ['ID','Nome','Marca','Categoria'],
          editableFields: ['nome','marca'], editHeaders: ['Nome','Marca'],
        }); break;
      case 'logs':         await this.renderLogs(main);        break;
    }
    observeNewElements();
  }

  /* ══════════════════════════════════════════════════════════ */
  /* OVERVIEW                                                   */
  /* ══════════════════════════════════════════════════════════ */
  async renderOverview(main) {
    try {
      const [users, products, stores, categories] = await Promise.all([
        api.get('/users'), api.get('/products'),
        api.get('/stores'), api.get('/categories'),
      ]);
      main.innerHTML = `
        <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:1.5rem">Visão Geral</h2>
        <div class="admin-stats">
          <div class="stat-card animate-scroll">
            <div class="stat-card__value">${(users.data||[]).length}</div>
            <div class="stat-card__label">Utilizadores activos</div>
          </div>
          <div class="stat-card animate-scroll">
            <div class="stat-card__value">${(products.data||[]).length}</div>
            <div class="stat-card__label">Produtos activos</div>
          </div>
          <div class="stat-card animate-scroll">
            <div class="stat-card__value">${(stores.data||[]).length}</div>
            <div class="stat-card__label">Lojas activas</div>
          </div>
          <div class="stat-card animate-scroll">
            <div class="stat-card__value">${(categories.data||[]).length}</div>
            <div class="stat-card__label">Categorias activas</div>
          </div>
        </div>
        <div class="admin-section animate-scroll">
          <div class="admin-section__header"><h3>Acesso rápido</h3></div>
          <div style="padding:1.5rem;display:flex;gap:1rem;flex-wrap:wrap">
            ${SECTIONS.filter(s => s.id !== 'overview').map(s => `
              <button class="btn btn--outline" data-goto="${s.id}">${s.icon} Gerir ${s.label}</button>
            `).join('')}
          </div>
        </div>
      `;
      main.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeSection = btn.dataset.goto;
          this.container.querySelectorAll('.admin-sidebar__item').forEach(i =>
            i.classList.toggle('admin-sidebar__item--active', i.dataset.section === this.activeSection));
          this.renderSection();
        });
      });
    } catch {
      main.innerHTML = '<p style="padding:2rem;color:#757575">Erro ao carregar dados.</p>';
    }
  }

  /* ══════════════════════════════════════════════════════════ */
  /* LOJAS — CRUD completo com URL/website                      */
  /* ══════════════════════════════════════════════════════════ */
  async renderLojas(main) {
    try {
      const res   = await api.get('/stores/all');
      const lojas = res.data || [];

      // Buscar links de todas as lojas activas para mostrar o URL
      let linksMap = {};
      try {
        const linksRes = await api.get('/store-links');
        (linksRes.data || []).forEach(l => {
          if (!linksMap[l.id_loja]) linksMap[l.id_loja] = l.link;
        });
      } catch { /* sem links */ }

      main.innerHTML = `
        <div class="admin-section animate-scroll">
          <div class="admin-section__header">
            <h3>🏪 Lojas</h3>
            <button class="btn--create" id="btn-nova-loja">+ Nova Loja</button>
          </div>
          <div id="loja-form-wrapper"></div>
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Nome</th><th>NIF</th><th>Município</th>
                  <th>Email</th><th>Website</th><th>Estado</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${lojas.map(l => `
                  <tr data-id="${l.id}">
                    <td>${l.id}</td>
                    <td><strong>${l.nome}</strong></td>
                    <td>${l.nif || '—'}</td>
                    <td>${l.municipio || '—'}</td>
                    <td>${l.email || '—'}</td>
                    <td>
                      ${linksMap[l.id]
                        ? `<a href="${linksMap[l.id]}" target="_blank" rel="noopener noreferrer"
                              style="color:var(--color-primary);font-size:0.8rem" title="${linksMap[l.id]}">
                             🔗 Abrir
                           </a>`
                        : '<span style="color:#aaa;font-size:0.8rem">—</span>'}
                    </td>
                    <td>
                      <span class="admin-badge ${l.deleted_at ? 'admin-badge--deleted' : 'admin-badge--active'}">
                        ${l.deleted_at ? 'Inativa' : 'Ativa'}
                      </span>
                    </td>
                    <td>
                      <div class="admin-actions">
                        ${!l.deleted_at ? `
                          <button class="btn btn--outline btn--sm" data-action="edit-loja" data-id="${l.id}">Editar</button>
                          <button class="btn btn--danger btn--sm" data-action="delete-loja" data-id="${l.id}">Eliminar</button>
                        ` : `
                          <button class="btn btn--outline btn--sm" data-action="restore-loja" data-id="${l.id}">Restaurar</button>
                        `}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this._bindLojaEvents(main, lojas, linksMap);
    } catch (err) {
      main.innerHTML = `<p style="padding:2rem;color:#757575">Erro ao carregar lojas: ${err.message}</p>`;
    }
  }

  _bindLojaEvents(main, lojas, linksMap) {
    // Botão criar
    main.querySelector('#btn-nova-loja')?.addEventListener('click', () => {
      this._showLojaForm(main, null, linksMap);
    });

    // Editar
    main.querySelectorAll('[data-action="edit-loja"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const loja = lojas.find(l => String(l.id) === btn.dataset.id);
        if (loja) this._showLojaForm(main, loja, linksMap);
      });
    });

    // Eliminar (soft delete)
    main.querySelectorAll('[data-action="delete-loja"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        modal.open({
          title: 'Eliminar loja',
          body: `<p>Confirmas a eliminação da loja <strong>#${id}</strong>? O registo será desactivado.</p>`,
          confirmText: 'Eliminar',
          onConfirm: async () => {
            try {
              await api.delete(`/stores/${id}`);
              toast.success('Loja eliminada.');
              modal.close();
              await this.renderLojas(main);
            } catch (err) { toast.error(err.message || 'Erro ao eliminar.'); }
          },
        });
      });
    });

    // Restaurar
    main.querySelectorAll('[data-action="restore-loja"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.put(`/stores/${btn.dataset.id}/restore`, {});
          toast.success('Loja restaurada.');
          await this.renderLojas(main);
        } catch (err) { toast.error(err.message || 'Erro ao restaurar.'); }
      });
    });
  }

  _showLojaForm(main, loja, linksMap) {
    const wrapper  = main.querySelector('#loja-form-wrapper');
    const isEdit   = Boolean(loja);
    const lojaLink = loja ? (linksMap[loja.id] || '') : '';

    wrapper.innerHTML = `
      <div class="admin-inline-form">
        <h4 style="font-weight:700;margin-bottom:1rem">${isEdit ? `✏️ Editar Loja #${loja.id}` : '➕ Nova Loja'}</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Nome *</label>
            <input id="lf-nome" type="text" value="${isEdit ? loja.nome : ''}" placeholder="Ex: Kero Viana" />
          </div>
          <div class="form-group">
            <label>NIF *</label>
            <input id="lf-nif" type="text" value="${isEdit ? (loja.nif||'') : ''}" placeholder="Ex: 5000001234" />
          </div>
          <div class="form-group">
            <label>Endereço</label>
            <input id="lf-endereco" type="text" value="${isEdit ? (loja.endereco||'') : ''}" placeholder="Ex: Av. 21 de Janeiro" />
          </div>
          <div class="form-group">
            <label>Município</label>
            <input id="lf-municipio" type="text" value="${isEdit ? (loja.municipio||'') : ''}" placeholder="Ex: Luanda" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input id="lf-email" type="email" value="${isEdit ? (loja.email||'') : ''}" placeholder="Ex: geral@kero.ao" />
          </div>
          <div class="form-group">
            <label>Website (URL)</label>
            <input id="lf-link" type="url" value="${lojaLink}" placeholder="Ex: https://kero.ao" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn--save" id="lf-save">Guardar</button>
          <button class="btn btn--outline" id="lf-cancel">Cancelar</button>
        </div>
      </div>
    `;

    wrapper.querySelector('#lf-cancel').addEventListener('click', () => { wrapper.innerHTML = ''; });

    wrapper.querySelector('#lf-save').addEventListener('click', async () => {
      const nome     = wrapper.querySelector('#lf-nome').value.trim();
      const nif      = wrapper.querySelector('#lf-nif').value.trim();
      const endereco = wrapper.querySelector('#lf-endereco').value.trim();
      const municipio= wrapper.querySelector('#lf-municipio').value.trim();
      const email    = wrapper.querySelector('#lf-email').value.trim();
      const link     = wrapper.querySelector('#lf-link').value.trim();

      if (!nome || !nif) { toast.error('Nome e NIF são obrigatórios.'); return; }

      try {
        let lojaId = isEdit ? loja.id : null;
        if (isEdit) {
          await api.put(`/stores/${loja.id}`, { nome, nif, endereco, municipio, email });
          toast.success('Loja actualizada.');
        } else {
          const r = await api.post('/stores', { nome, nif, endereco, municipio, email });
          lojaId = r.data?.id;
          toast.success('Loja criada.');
        }

        // Gerir o link/website
        if (link && lojaId) {
          const existingLink = linksMap[lojaId];
          if (!existingLink) {
            await api.post('/store-links', { link, id_loja: lojaId });
          } else {
            // Encontrar o id do link para actualizar
            try {
              const lr = await api.get(`/store-links/store/${lojaId}`);
              const lkId = (lr.data||[])[0]?.id;
              if (lkId) await api.put(`/store-links/${lkId}`, { link, id_loja: lojaId });
            } catch { /* sem link anterior */ }
          }
        }

        wrapper.innerHTML = '';
        await this.renderLojas(main);
      } catch (err) { toast.error(err.message || 'Erro ao guardar loja.'); }
    });
  }

  /* ══════════════════════════════════════════════════════════ */
  /* UTILIZADORES — CRUD com role e password                   */
  /* ══════════════════════════════════════════════════════════ */
  async renderUtilizadores(main) {
    try {
      const res   = await api.get('/users/all');
      const users = res.data || [];

      main.innerHTML = `
        <div class="admin-section animate-scroll">
          <div class="admin-section__header">
            <h3>👤 Utilizadores</h3>
            <button class="btn--create" id="btn-novo-user">+ Novo Utilizador</button>
          </div>
          <div id="user-form-wrapper"></div>
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Nome</th><th>Email</th><th>Role</th>
                  <th>Município</th><th>Estado</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr data-id="${u.id}">
                    <td>${u.id}</td>
                    <td>
                      <div class="admin-table__user">
                        <div class="admin-table__avatar">${(u.p_nome||'?')[0].toUpperCase()}</div>
                        <div>
                          <div class="admin-table__name">${u.p_nome||''} ${u.u_nome||''}</div>
                        </div>
                      </div>
                    </td>
                    <td>${u.email}</td>
                    <td>
                      <span class="admin-badge ${u.role === 'admin' ? 'admin-badge--admin' : 'admin-badge--active'}">
                        ${u.role || 'user'}
                      </span>
                    </td>
                    <td>${u.municipio||'—'}</td>
                    <td>
                      <span class="admin-badge ${u.deleted_at ? 'admin-badge--deleted' : 'admin-badge--active'}">
                        ${u.deleted_at ? 'Inativo' : 'Ativo'}
                      </span>
                    </td>
                    <td>
                      <div class="admin-actions">
                        ${!u.deleted_at ? `
                          <button class="btn btn--outline btn--sm" data-action="edit-user" data-id="${u.id}">Editar</button>
                          <button class="btn btn--danger btn--sm" data-action="delete-user" data-id="${u.id}">Eliminar</button>
                        ` : `
                          <button class="btn btn--outline btn--sm" data-action="restore-user" data-id="${u.id}">Restaurar</button>
                          <button class="btn btn--danger btn--sm" data-action="harddelete-user" data-id="${u.id}">Apagar</button>
                        `}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this._bindUserEvents(main, users);
    } catch (err) {
      main.innerHTML = `<p style="padding:2rem;color:#757575">Erro ao carregar utilizadores: ${err.message}</p>`;
    }
  }

  _bindUserEvents(main, users) {
    main.querySelector('#btn-novo-user')?.addEventListener('click', () => {
      this._showUserForm(main, null);
    });

    main.querySelectorAll('[data-action="edit-user"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => String(x.id) === btn.dataset.id);
        if (u) this._showUserForm(main, u);
      });
    });

    main.querySelectorAll('[data-action="delete-user"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        modal.open({
          title: 'Eliminar utilizador',
          body: `<p>Confirmas a desactivação do utilizador <strong>#${id}</strong>?</p>`,
          confirmText: 'Eliminar',
          onConfirm: async () => {
            try {
              await api.delete(`/users/${id}`);
              toast.success('Utilizador eliminado.');
              modal.close();
              await this.renderUtilizadores(main);
            } catch (err) { toast.error(err.message || 'Erro ao eliminar.'); }
          },
        });
      });
    });

    main.querySelectorAll('[data-action="restore-user"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.put(`/users/${btn.dataset.id}/restore`, {});
          toast.success('Utilizador restaurado.');
          await this.renderUtilizadores(main);
        } catch (err) { toast.error(err.message || 'Erro ao restaurar.'); }
      });
    });

    main.querySelectorAll('[data-action="harddelete-user"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        modal.open({
          title: '⚠️ Apagar permanentemente',
          body: `<p>Esta acção é <strong>irreversível</strong>. Apagar o utilizador <strong>#${id}</strong> permanentemente?</p>`,
          confirmText: 'Apagar definitivamente',
          onConfirm: async () => {
            try {
              await api.delete(`/users/${id}/hard`);
              toast.success('Utilizador apagado permanentemente.');
              modal.close();
              await this.renderUtilizadores(main);
            } catch (err) { toast.error(err.message || 'Erro ao apagar.'); }
          },
        });
      });
    });
  }

  _showUserForm(main, user) {
    const wrapper = main.querySelector('#user-form-wrapper');
    const isEdit  = Boolean(user);

    wrapper.innerHTML = `
      <div class="admin-inline-form">
        <h4 style="font-weight:700;margin-bottom:1rem">${isEdit ? `✏️ Editar Utilizador #${user.id}` : '➕ Novo Utilizador'}</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Primeiro nome *</label>
            <input id="uf-pnome" type="text" value="${isEdit ? (user.p_nome||'') : ''}" placeholder="Ex: João" />
          </div>
          <div class="form-group">
            <label>Último nome *</label>
            <input id="uf-unome" type="text" value="${isEdit ? (user.u_nome||'') : ''}" placeholder="Ex: Silva" />
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input id="uf-email" type="email" value="${isEdit ? (user.email||'') : ''}" placeholder="Ex: joao@exemplo.ao" />
          </div>
          <div class="form-group">
            <label>${isEdit ? 'Nova palavra-passe (deixar em branco para manter)' : 'Palavra-passe *'}</label>
            <input id="uf-pass" type="password" placeholder="${isEdit ? 'Nova palavra-passe...' : 'Mínimo 6 caracteres'}" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select id="uf-role">
              <option value="user"  ${(!isEdit || user.role === 'user')  ? 'selected' : ''}>Utilizador</option>
              <option value="admin" ${(isEdit && user.role === 'admin')  ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label>Município</label>
            <input id="uf-municipio" type="text" value="${isEdit ? (user.municipio||'') : ''}" placeholder="Ex: Luanda" />
          </div>
          <div class="form-group">
            <label>Rua / Endereço</label>
            <input id="uf-rua" type="text" value="${isEdit ? (user.rua||'') : ''}" placeholder="Ex: Av. 21 de Janeiro" />
          </div>
          <div class="form-group">
            <label>Género</label>
            <select id="uf-genero">
              <option value="masculino" ${isEdit && user.genero === 'masculino' ? 'selected' : ''}>Masculino</option>
              <option value="feminino"  ${isEdit && user.genero === 'feminino'  ? 'selected' : ''}>Feminino</option>
              <option value="outro"     ${isEdit && user.genero === 'outro'     ? 'selected' : ''}>Outro</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn--save" id="uf-save">Guardar</button>
          <button class="btn btn--outline" id="uf-cancel">Cancelar</button>
        </div>
      </div>
    `;

    wrapper.querySelector('#uf-cancel').addEventListener('click', () => { wrapper.innerHTML = ''; });

    wrapper.querySelector('#uf-save').addEventListener('click', async () => {
      const p_nome      = wrapper.querySelector('#uf-pnome').value.trim();
      const u_nome      = wrapper.querySelector('#uf-unome').value.trim();
      const email       = wrapper.querySelector('#uf-email').value.trim();
      const pass        = wrapper.querySelector('#uf-pass').value;
      const role        = wrapper.querySelector('#uf-role').value;
      const municipio   = wrapper.querySelector('#uf-municipio').value.trim();
      const rua         = wrapper.querySelector('#uf-rua').value.trim();
      const genero      = wrapper.querySelector('#uf-genero').value;

      if (!p_nome || !u_nome || !email) { toast.error('Nome e email são obrigatórios.'); return; }
      if (!isEdit && !pass)             { toast.error('Palavra-passe obrigatória para novo utilizador.'); return; }

      const payload = { p_nome, u_nome, email, role, municipio, rua, genero };
      if (pass) payload.palavra_passe = pass;

      // Para criar utilizador, campos obrigatórios adicionais
      if (!isEdit) {
        payload.data_nascimento = '2000-01-01'; // placeholder — ajustável conforme schema
      }

      try {
        if (isEdit) {
          await api.put(`/users/${user.id}`, payload);
          toast.success('Utilizador actualizado.');
        } else {
          await api.post('/users', payload);
          toast.success('Utilizador criado.');
        }
        wrapper.innerHTML = '';
        await this.renderUtilizadores(main);
      } catch (err) { toast.error(err.message || 'Erro ao guardar utilizador.'); }
    });
  }

  /* ══════════════════════════════════════════════════════════ */
  /* LOGS DE SCRAPERS                                           */
  /* ══════════════════════════════════════════════════════════ */
  async renderLogs(main) {
    main.innerHTML = `
      <div class="admin-section animate-scroll">
        <div class="admin-section__header">
          <h3>📋 Logs dos Scrapers</h3>
          <button class="btn btn--outline btn--sm" id="btn-refresh-logs">🔄 Actualizar</button>
        </div>
        <div class="log-controls">
          <div class="log-filter-bar" id="log-filters">
            <button class="log-filter-btn active" data-level="ALL">Todos</button>
            <button class="log-filter-btn level-info"  data-level="INFO">INFO</button>
            <button class="log-filter-btn level-error" data-level="ERROR">ERROR</button>
            <button class="log-filter-btn level-warn"  data-level="WARN">WARN</button>
          </div>
          <input id="log-search" type="text" placeholder="🔍 Filtrar por mensagem..."
            style="padding:0.4rem 0.75rem;border:1.5px solid var(--color-gray-200);border-radius:var(--radius-full);font-size:0.85rem;outline:none;min-width:220px" />
        </div>
        <div id="log-list-wrapper">
          <div class="log-empty">A carregar logs…</div>
        </div>
      </div>
    `;

    let entries   = [];
    let levelFilter = 'ALL';
    let textFilter  = '';

    const renderEntries = () => {
      const wrapper = main.querySelector('#log-list-wrapper');
      let filtered = entries;
      if (levelFilter !== 'ALL') filtered = filtered.filter(e => e.level === levelFilter);
      if (textFilter)            filtered = filtered.filter(e => (e.message||'').toLowerCase().includes(textFilter.toLowerCase()));

      if (filtered.length === 0) {
        wrapper.innerHTML = '<div class="log-empty">Sem entradas para os filtros seleccionados.</div>';
        return;
      }

      wrapper.innerHTML = `
        <div class="log-list">
          ${filtered.map(e => {
            const ts   = e.timestamp ? new Date(e.timestamp).toLocaleString('pt-PT') : '—';
            const lvl  = e.level || 'RAW';
            const meta = Object.entries(e)
              .filter(([k]) => !['timestamp','level','message'].includes(k))
              .map(([k,v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
              .join(' · ');
            return `
              <div class="log-entry">
                <span class="log-entry__time">${ts}</span>
                <span class="log-entry__level log-entry__level--${lvl}">${lvl}</span>
                <div>
                  <div class="log-entry__msg">${e.message || '—'}</div>
                  ${meta ? `<div class="log-entry__meta">${meta}</div>` : ''}
                </div>
              </div>`;
          }).join('')}
        </div>
      `;
    };

    const loadLogs = async () => {
      try {
        const res = await api.get('/admin/logs?limit=300');
        entries = res.data?.entries || [];
        renderEntries();
      } catch (err) {
        main.querySelector('#log-list-wrapper').innerHTML =
          `<div class="log-empty" style="color:#C62828">Erro ao carregar logs: ${err.message}</div>`;
      }
    };

    await loadLogs();

    main.querySelector('#btn-refresh-logs')?.addEventListener('click', loadLogs);

    main.querySelectorAll('.log-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        main.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        levelFilter = btn.dataset.level;
        renderEntries();
      });
    });

    main.querySelector('#log-search')?.addEventListener('input', e => {
      textFilter = e.target.value;
      renderEntries();
    });
  }

  /* ══════════════════════════════════════════════════════════ */
  /* TABELA GENÉRICA (Categorias, Produtos)                     */
  /* ══════════════════════════════════════════════════════════ */
  async renderGenericTable(main, { title, endpoint, fields, headers, editableFields, editHeaders }) {
    try {
      const res  = await api.get(`${endpoint}/all`);
      const rows = res.data || [];

      main.innerHTML = `
        <div class="admin-section animate-scroll">
          <div class="admin-section__header">
            <h3>${title}</h3>
          </div>
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                  <th>Estado</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    ${fields.map(f => `<td>${row[f] ?? '—'}</td>`).join('')}
                    <td>
                      <span class="admin-badge ${row.deleted_at ? 'admin-badge--deleted' : 'admin-badge--active'}">
                        ${row.deleted_at ? 'Inativo' : 'Ativo'}
                      </span>
                    </td>
                    <td>
                      <div class="admin-actions">
                        ${!row.deleted_at
                          ? `<button class="btn btn--outline btn--sm" data-action="edit"    data-id="${row.id}">Editar</button>
                             <button class="btn btn--danger   btn--sm" data-action="delete"  data-id="${row.id}">Eliminar</button>`
                          : `<button class="btn btn--outline btn--sm" data-action="restore" data-id="${row.id}">Restaurar</button>`}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Editar
      main.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id  = btn.dataset.id;
          const row = rows.find(r => String(r.id) === id);
          if (!row) return;
          modal.open({
            title: `Editar ${title} #${id}`,
            body: editableFields.map((f, i) => `
              <div class="form-group">
                <label>${editHeaders[i]}</label>
                <input type="text" id="ef-${f}" value="${row[f] ?? ''}" />
              </div>`).join(''),
            confirmText: 'Guardar',
            onConfirm: async () => {
              const payload = {};
              editableFields.forEach(f => {
                payload[f] = document.querySelector(`#ef-${f}`)?.value.trim() ?? '';
              });
              try {
                await api.put(`${endpoint}/${id}`, payload);
                toast.success('Registo actualizado.');
                modal.close();
                await this.renderGenericTable(main, { title, endpoint, fields, headers, editableFields, editHeaders });
              } catch (err) { toast.error(err.message || 'Erro ao actualizar.'); }
            },
          });
        });
      });

      // Eliminar
      main.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          modal.open({
            title: 'Confirmar eliminação',
            body: `<p>Eliminar o registo <strong>#${id}</strong>?</p>`,
            confirmText: 'Eliminar',
            onConfirm: async () => {
              try {
                await api.delete(`${endpoint}/${id}`);
                toast.success('Registo eliminado.');
                modal.close();
                await this.renderGenericTable(main, { title, endpoint, fields, headers, editableFields, editHeaders });
              } catch (err) { toast.error(err.message || 'Erro ao eliminar.'); }
            },
          });
        });
      });

      // Restaurar
      main.querySelectorAll('[data-action="restore"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.put(`${endpoint}/${btn.dataset.id}/restore`, {});
            toast.success('Registo restaurado.');
            await this.renderGenericTable(main, { title, endpoint, fields, headers, editableFields, editHeaders });
          } catch (err) { toast.error(err.message || 'Erro ao restaurar.'); }
        });
      });

    } catch {
      main.innerHTML = '<p style="padding:2rem;color:#757575">Erro ao carregar dados.</p>';
    }
  }
}
