import { api }    from '../api.js';
import { auth }   from '../auth.js';
import { router } from '../router.js';
import { toast }  from '../components/Toast.js';
import { modal }  from '../components/Modal.js';
import { Loader } from '../components/Loader.js';
import { plus, refresh, warning, search, starsHtml } from '../components/icons.js';
import { observeNewElements } from '../animations.js';

/* ─── Secções disponíveis na sidebar ──────────────────────────── */
const SECTIONS = [
  { id: 'overview',      label: 'Visão Geral',  icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5h7V20H4zM13 4h7v7h-7zM13 13h7v7h-7zM4 4h7v6.5H4z"/></svg>' },
  { id: 'lojas',         label: 'Lojas',         icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 20v-7h6v7M7 9.5h10"/></svg>' },
  { id: 'utilizadores',  label: 'Utilizadores',  icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/><circle cx="10" cy="7" r="3.5"/><path d="M19 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8"/></svg>' },
  { id: 'categorias',    label: 'Categorias',    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 9h8M8 12h8M8 15h5"/></svg>' },
  { id: 'produtos',      label: 'Produtos',      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5z"/><path d="M12 4v8m0 8v-8m-7-4.5 7 4 7-4"/></svg>' },
  { id: 'logs',          label: 'Logs Scrapers', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>' },
  { id: 'avaliacoes',    label: 'Avaliações',   icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>' },
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
            <div class="admin-sidebar__mark">X</div>
            <div>
              <h2>Admin</h2>
              <p>${user?.p_nome || user?.email || 'Administrador'}</p>
            </div>
          </div>
          <nav class="admin-sidebar__nav">
            ${SECTIONS.map(s => `
              <div class="admin-sidebar__item ${s.id === this.activeSection ? 'admin-sidebar__item--active' : ''}"
                   data-section="${s.id}">
                <span class="admin-sidebar__icon">${s.icon}</span>
                <span>${s.label}</span>
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
      case 'avaliacoes':   await this.renderAvaliacoes(main);  break;
    }
    observeNewElements();
  }

  /* ══════════════════════════════════════════════════════════ */
  /* OVERVIEW                                                   */
  /* ══════════════════════════════════════════════════════════ */
  async renderOverview(main) {
    try {
      const [users, categories, catalog, scrapingCfg, scrapingStatus] = await Promise.all([
        api.get('/users'),
        api.get('/categories'),
        api.get('/store-products/catalog-status'),
        api.get('/admin/scraping/config'),
        api.get('/admin/scraping/status'),
      ]);

      const totalUtilizadores = (users.data || []).length;
      const totalCategorias  = (categories.data || []).length;
      const cat   = catalog.data || {};
      const totalOfertas    = cat.totalOfertas ?? 0;
      const minimoEsperado  = cat.minimoEsperado ?? 60;
      const catalogoPopulado = cat.populado !== false;

      const cfg       = scrapingCfg.data || { total: 0, scrapers: [] };
      const scrapers  = cfg.scrapers || [];
      const activos   = scrapers.filter(s => s.ativo).length;

      const st    = scrapingStatus.data || {};
      const stats = st.ultimasEstatisticas || null;
      const statsScrapers = stats?.scrapers || {};
      const ultimaExecFmt = st.ultimaExecucao
        ? new Date(st.ultimaExecucao).toLocaleString('pt-PT')
        : 'ainda não executou';

      const ofertaTrend = catalogoPopulado
        ? `mínimo definido: ${minimoEsperado}`
        : 'catálogo a ser populado…';

      main.innerHTML = `
        <div class="admin-overview">
          <div class="overview-header">
            <div>
              <p class="overview-kicker">Operação</p>
              <h2>Visão Geral</h2>
            </div>
            <span class="overview-badge">Live</span>
          </div>

          <div class="admin-stats admin-stats--overview">
            <div class="stat-card stat-card--primary animate-scroll">
              <div class="stat-card__meta">
                <span class="stat-card__dot stat-card__dot--primary"></span>
                <span>Utilizadores</span>
              </div>
              <div class="stat-card__value">${totalUtilizadores}</div>
              <div class="stat-card__label">registados na plataforma</div>
            </div>
            <div class="stat-card stat-card--secondary animate-scroll">
              <div class="stat-card__meta">
                <span class="stat-card__dot stat-card__dot--secondary"></span>
                <span>Ofertas no catálogo</span>
              </div>
              <div class="stat-card__value">${totalOfertas}</div>
              <div class="stat-card__label">${ofertaTrend}</div>
            </div>
            <div class="stat-card stat-card--success animate-scroll">
              <div class="stat-card__meta">
                <span class="stat-card__dot stat-card__dot--success"></span>
                <span>Scrapers</span>
              </div>
              <div class="stat-card__value">${activos}<span style="font-size:0.5em;color:var(--color-gray-500)">/${cfg.total}</span></div>
              <div class="stat-card__label">activos na configuração</div>
            </div>
            <div class="stat-card stat-card--neutral animate-scroll">
              <div class="stat-card__meta">
                <span class="stat-card__dot stat-card__dot--wood"></span>
                <span>Categorias</span>
              </div>
              <div class="stat-card__value">${totalCategorias}</div>
              <div class="stat-card__label">cadastradas</div>
            </div>
          </div>

          <div class="overview-panels">
            <div class="admin-section animate-scroll">
              <div class="admin-section__header">
                <h3>Estado dos scrapers</h3>
                <div style="display:flex;align-items:center;gap:.75rem;">
                  ${st.emExecucao
                    ? '<span style="display:inline-flex;align-items:center;gap:.4rem;font-size:var(--font-size-xs);font-weight:700;color:#e6740a;"><span style="width:8px;height:8px;border-radius:50%;background:#e6740a;animation:pulse-dot 1.2s infinite;"></span>Em execução…</span>'
                    : ''}
                  <button id="btn-run-scrapers" class="btn btn--primary btn--sm" ${st.emExecucao ? 'disabled' : ''}>
                    ${st.emExecucao ? 'A correr…' : 'Correr scrapers agora'}
                  </button>
                </div>
              </div>
              <p style="font-size:var(--font-size-xs);color:var(--color-gray-500);margin-bottom:.75rem;">
                Última execução: ${ultimaExecFmt}${stats ? ` · <span class="icon">${plus}</span> ${stats.totalInserts ?? 0} inserções · <span class="icon">${refresh}</span> ${stats.totalUpdates ?? 0} actualizações · <span class="icon">${warning}</span> ${stats.totalErrors ?? 0} erros` : ''}
              </p>
              <div class="admin-table-wrapper">
                <table class="admin-table">
                  <thead>
                    <tr><th>Loja</th><th>Config.</th><th>Produtos recolhidos</th><th>Upserts</th><th>Erros de upsert</th></tr>
                  </thead>
                  <tbody>
                    ${scrapers.map(s => {
                      const r = statsScrapers[s.codigo];
                      return `
                        <tr>
                          <td><strong>${s.nome}</strong></td>
                          <td>${s.ativo
                            ? '<span style="color:#2e7d32;font-weight:700;">activo</span>'
                            : '<span style="color:#9e9e9e;">inactivo</span>'}</td>
                          <td>${r ? (r.produtosColetados ?? 0) : '—'}</td>
                          <td>${r ? `${r.upsertStats?.inserts ?? 0} ins. / ${r.upsertStats?.updates ?? 0} act.` : '—'}</td>
                          <td>${r ? (r.upsertStats?.errors ?? 0) : '—'}</td>
                        </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <div class="admin-section animate-scroll">
              <div class="admin-section__header"><h3>Acesso rápido</h3></div>
              <div class="quick-actions">
                ${SECTIONS.filter(s => s.id !== 'overview').map(s => `
                  <button class="quick-action" data-goto="${s.id}">
                    <span class="quick-action__icon">${s.icon}</span>
                    <span>Gerir ${s.label}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      main.querySelector('#btn-run-scrapers')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'A iniciar…';
        try {
          await api.post('/admin/scraping/run', {});
          this._scheduleScraperRefresh();
        } catch (err) {
          btn.textContent = err.status === 409 ? 'Já está a correr' : 'Correr scrapers agora';
          btn.disabled = err.status === 409;
        }
      });

      main.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeSection = btn.dataset.goto;
          this.container.querySelectorAll('.admin-sidebar__item').forEach(i =>
            i.classList.toggle('admin-sidebar__item--active', i.dataset.section === this.activeSection));
          this.renderSection();
        });
      });

      // Se o pipeline já estava a correr ao abrir o painel, acompanha.
      if (st.emExecucao) this._scheduleScraperRefresh();
    } catch {
      main.innerHTML = '<p style="padding:2rem;color:#757575">Erro ao carregar dados.</p>';
    }
  }

  /**
   * Re-renderiza o overview após alguns segundos para apanhar o resultado
   * da execução dos scrapers. Continua a acompanhar enquanto estiver a correr.
   */
  _scheduleScraperRefresh() {
    clearTimeout(this._scraperTimer);
    this._scraperTimer = setTimeout(async () => {
      if (this.activeSection !== 'overview') return;
      let aindaACorrer = false;
      try {
        const st = await api.get('/admin/scraping/status');
        aindaACorrer = !!st.data?.emExecucao;
      } catch { /* segue com re-render normal */ }
      await this.renderSection();
      if (aindaACorrer) this._scheduleScraperRefresh();
    }, 5000);
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
            <h3><span class="section-title-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 20v-7h6v7M7 9.5h10"/></svg></span>Lojas</h3>
            <button class="btn--create" id="btn-nova-loja">Nova Loja</button>
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
                              style="color:var(--color-accent);font-size:0.8rem;display:inline-flex;align-items:center;gap:0.35rem;font-weight:600" title="${linksMap[l.id]}">
                             <svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/></svg>
                             Abrir
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
        <h4 style="font-weight:700;margin-bottom:1rem">${isEdit ? `Editar Loja #${loja.id}` : 'Nova Loja'}</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Nome *</label>
            <input id="lf-nome" type="text" value="${isEdit ? loja.nome : ''}" placeholder="Ex: NCR Angola" />
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
            <input id="lf-email" type="email" value="${isEdit ? (loja.email||'') : ''}" placeholder="Ex: geral@ncrangola.com" />
            <input id="lf-codigo" type="text" value="${isEdit ? (loja.codigo||'') : ''}" placeholder="Código opcional: ncr" />
          </div>
          <div class="form-group">
            <label>Website (URL)</label>
            <input id="lf-link" type="url" value="${lojaLink}" placeholder="Ex: https://www.ncrangola.com" />
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
      const codigo   = wrapper.querySelector('#lf-codigo').value.trim();
      const link     = wrapper.querySelector('#lf-link').value.trim();

      if (!nome || !nif) { toast.error('Nome e NIF são obrigatórios.'); return; }

      try {
        let lojaId = isEdit ? loja.id : null;
        if (isEdit) {
          await api.put(`/stores/${loja.id}`, { nome, nif, endereco, municipio, email, codigo });
          toast.success('Loja actualizada.');
        } else {
          const r = await api.post('/stores', { nome, nif, endereco, municipio, email, codigo });
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
            <h3><span class="section-title-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/><circle cx="10" cy="7" r="3.5"/><path d="M19 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8"/></svg></span>Utilizadores</h3>
            <button class="btn--create" id="btn-novo-user">Novo Utilizador</button>
          </div>
          <div id="user-form-wrapper"></div>
          ${this._searchBoxHtml('Pesquisar por nome, email, role…')}
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
      this._bindTableSearch(main);
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
          await api.patch(`/users/${btn.dataset.id}/restore`, null);
          toast.success('Utilizador restaurado.');
          await this.renderUtilizadores(main);
        } catch (err) { toast.error(err.message || 'Erro ao restaurar.'); }
      });
    });

    main.querySelectorAll('[data-action="harddelete-user"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        modal.open({
          title: 'Apagar permanentemente',
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
        <h4 style="font-weight:700;margin-bottom:1rem">${isEdit ? `Editar Utilizador #${user.id}` : 'Novo Utilizador'}</h4>
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
          <h3><span class="section-title-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></span>Logs dos Scrapers</h3>
          <button class="btn btn--outline btn--sm" id="btn-refresh-logs"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v6h-6"/></svg>Actualizar</button>
        </div>
        <div class="log-controls">
          <div class="log-filter-bar" id="log-filters">
            <button class="log-filter-btn active" data-level="ALL">Todos</button>
            <button class="log-filter-btn level-info"  data-level="INFO">INFO</button>
            <button class="log-filter-btn level-error" data-level="ERROR">ERROR</button>
            <button class="log-filter-btn level-warn"  data-level="WARN">WARN</button>
          </div>
          <input id="log-search" type="text" placeholder="Filtrar por mensagem..."
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
  /* AVALIAÇÕES — moderação                                     */
  /* ══════════════════════════════════════════════════════════ */
  async renderAvaliacoes(main) {
    try {
      const res = await api.get('/admin/reviews');
      const avaliacoes = res.data || [];

      main.innerHTML = `
        <div class="admin-section animate-scroll">
          <div class="admin-section__header">
            <h3>Avaliações de Lojas</h3>
          </div>
          ${avaliacoes.length === 0
            ? '<p style="color:var(--color-gray-600);padding:1rem 0;">Ainda não existem avaliações.</p>'
            : `
          ${this._searchBoxHtml('Pesquisar por loja, utilizador, comentário…')}
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr><th>ID</th><th>Loja</th><th>Utilizador</th><th>Nota</th><th>Comentário</th><th>Data</th><th>Ações</th></tr>
              </thead>
              <tbody>
                ${avaliacoes.map(av => `
                  <tr>
                    <td>${av.id}</td>
                    <td><strong>${av.loja_nome}</strong></td>
                    <td>${av.utilizador_nome} ${av.utilizador_unome || ''}<br><span style="color:var(--color-gray-600);font-size:.78rem;">${av.utilizador_email}</span></td>
                    <td>${starsHtml(av.nota)}</td>
                    <td style="max-width:320px;">${av.comentario || '—'}</td>
                    <td>${new Date(av.created_at).toLocaleDateString('pt-PT')}</td>
                    <td>
                      <button class="btn btn--danger btn--sm" data-review-id="${av.id}" data-store-id="${av.id_loja}">Eliminar</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      `;

      this._bindTableSearch(main);
      main.querySelectorAll('[data-review-id]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!window.confirm('Remover esta avaliação?')) return;
          try {
            await api.delete(`/stores/${btn.dataset.storeId}/reviews/${btn.dataset.reviewId}`);
            toast.success('Avaliação removida.');
            this.renderAvaliacoes(main);
          } catch (err) {
            toast.error(err.message || 'Não foi possível remover.');
          }
        });
      });
    } catch (err) {
      main.innerHTML = `<p style="padding:2rem;color:#757575">Erro ao carregar avaliações: ${err.message}</p>`;
    }
  }

  /* ══════════════════════════════════════════════════════════ */
  /* PESQUISA EM TABELAS                                        */
  /* ══════════════════════════════════════════════════════════ */
  _searchBoxHtml(placeholder = 'Pesquisar…') {
    return `
      <div class="admin-search">
        <span class="icon">${search}</span>
        <input type="search" class="admin-search__input" placeholder="${placeholder}" autocomplete="off" />
      </div>`;
  }

  /**
   * Liga um input .admin-search à tabela da mesma secção: filtra as linhas
   * do tbody pelo texto, sem recarregar dados.
   */
  _bindTableSearch(scope = this.container) {
    scope.querySelectorAll('.admin-search').forEach(box => {
      const input = box.querySelector('input');
      const tbody = box.closest('.admin-section')?.querySelector('.admin-table tbody');
      if (!input || !tbody) return;
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        tbody.querySelectorAll('tr').forEach(tr => {
          tr.style.display = (!q || tr.textContent.toLowerCase().includes(q)) ? '' : 'none';
        });
      });
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
          ${this._searchBoxHtml(`Pesquisar ${title.toLowerCase()}…`)}
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

      // Pesquisa
      this._bindTableSearch(main);

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
