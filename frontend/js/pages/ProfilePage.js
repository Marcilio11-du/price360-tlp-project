import { api } from "../api.js";
import { auth } from "../auth.js";
import { router } from "../router.js";
import { toast } from "../components/Toast.js";
import { observeNewElements } from "../animations.js";

/**
 * Página de Perfil do Utilizador (com avatar, dados pessoais e preferências)
 * Implementa um design tipo Instagram com pré-preenchimento de dados.
 */
class ProfilePage {
  constructor() {
    this.container = document.getElementById("app");
    this.currentUser = null;
    this.isUploadingAvatar = false;
  }

  /**
   * Verifica se o utilizador está autenticado.
   * Redireciona para /login se não estiver.
   */
  checkAuth() {
    if (!auth.isAuthenticated()) {
      router.navigate("/login");
      return false;
    }
    this.currentUser = auth.getUser();
    return true;
  }

  /**
   * Carrega dados completos do utilizador a partir do servidor.
   * Garante que formulário tem dados atualizados da base de dados.
   */
  async loadUserData() {
    try {
      if (!this.currentUser?.id) return false;
      
      const token = auth.getToken();
      const response = await fetch(`/api/v1/users/${this.currentUser.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          // Atualizar dados com informações do servidor
          this.currentUser = {
            ...this.currentUser,
            ...result.data
          };
          // Atualizar localStorage com dados completos
          auth.setAuth(token, this.currentUser);
          return true;
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar dados do utilizador:', error);
    }
    return false;
  }

  /**
   * Renderiza a página de perfil com formulário de edição e upload de avatar.
   */
  async render() {
    if (!this.checkAuth()) return;
    
    // Carregar dados completos do servidor
    await this.loadUserData();

    this.container.innerHTML = `
      <div class="profile-page animate-scroll">
        <div class="profile-container">
          
          <!-- Seção de Avatar + Info (Tipo Instagram) -->
          <section class="profile-avatar-section">
            <div class="profile-avatar-box">
              <div class="profile-avatar-preview" id="avatar-preview">
                <img 
                  id="avatar-image"
                  src="${this.getAvatarSrc()}" 
                  alt="Avatar de ${this.currentUser.p_nome}" 
                  class="profile-avatar-preview__img"
                  onerror="this.src='./assets/logo.png'" />
              </div>
              <div class="profile-avatar-actions">
                <label for="avatar-input" class="profile-avatar-btn profile-avatar-btn--primary">
                  Editar Foto
                </label>
                <input
                  type="file"
                  id="avatar-input"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="profile-avatar-input"
                  hidden />
                ${this.currentUser.avatar_path ? `
                  <button type="button" class="profile-avatar-btn profile-avatar-btn--danger" id="remove-avatar-btn">
                    Remover
                  </button>
                ` : ''}
              </div>
              <p class="profile-avatar-help">
                Máx. 5MB • JPG, PNG, WebP, GIF
              </p>
            </div>

            <!-- Informações ao lado do avatar -->
            <div class="profile-info-section">
              <div class="profile-info-header">
                <h1 class="profile-username">${this.currentUser.p_nome} ${this.currentUser.u_nome || ''}</h1>
                <p class="profile-email">${this.currentUser.email}</p>
                <p class="profile-bio">${this.currentUser.municipio || 'Utilizador Price360'}</p>
              </div>
              <div class="profile-stats">
                <div class="profile-stat">
                  <span class="profile-stat__value">Price360</span>
                  <span class="profile-stat__label">Membro</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Seção de Dados Pessoais -->
          <section class="profile-section profile-data-section">
            <h2 class="profile-section__title">Dados Pessoais</h2>
            <form class="profile-form" id="profile-form" novalidate>
              <div class="profile-form-row">
                <div class="form-group profile-form-group">
                  <label for="profile-p-nome">Primeiro Nome</label>
                  <input
                    type="text"
                    id="profile-p-nome"
                    name="p_nome"
                    value="${this.currentUser.p_nome || ''}"
                    placeholder="Primeiro nome"
                    required />
                </div>
                <div class="form-group profile-form-group">
                  <label for="profile-u-nome">Último Nome</label>
                  <input
                    type="text"
                    id="profile-u-nome"
                    name="u_nome"
                    value="${this.currentUser.u_nome || ''}"
                    placeholder="Último nome"
                    required />
                </div>
              </div>

              <div class="form-group profile-form-group">
                <label for="profile-email">Email</label>
                <input
                  type="email"
                  id="profile-email"
                  name="email"
                  value="${this.currentUser.email || ''}"
                  placeholder="email@exemplo.com"
                  required
                  autocomplete="email" />
              </div>

              <div class="profile-form-row">
                <div class="form-group profile-form-group">
                  <label for="profile-data-nascimento">Data de Nascimento</label>
                  <input
                    type="date"
                    id="profile-data-nascimento"
                    name="data_nascimento"
                    value="${this.formatDateForInput(this.currentUser.data_nascimento)}"
                    required />
                </div>
                <div class="form-group profile-form-group">
                  <label for="profile-genero">Género</label>
                  <select id="profile-genero" name="genero" required>
                    <option value="">Selecciona o género</option>
                    <option value="masculino" ${this.currentUser.genero === 'masculino' ? 'selected' : ''}>Masculino</option>
                    <option value="feminino" ${this.currentUser.genero === 'feminino' ? 'selected' : ''}>Feminino</option>
                  </select>
                </div>
              </div>

              <div class="profile-form-row">
                <div class="form-group profile-form-group">
                  <label for="profile-rua">Morada</label>
                  <input
                    type="text"
                    id="profile-rua"
                    name="rua"
                    value="${this.currentUser.rua || ''}"
                    placeholder="Rua, avenida, etc."
                    required />
                </div>
                <div class="form-group profile-form-group">
                  <label for="profile-municipio">Município</label>
                  <input
                    type="text"
                    id="profile-municipio"
                    name="municipio"
                    value="${this.currentUser.municipio || ''}"
                    placeholder="Município de residência"
                    required />
                </div>
              </div>
            </form>
          </section>

          <!-- Seção de Preferências -->
          <section class="profile-section profile-preferences-section">
            <h2 class="profile-section__title">Preferências Regionais</h2>
            <form class="profile-form" id="preferences-form" novalidate>
              <div class="form-group profile-form-group">
                <label for="profile-municipio-preferencial">Município Preferencial para Compras</label>
                <input
                  type="text"
                  id="profile-municipio-preferencial"
                  name="municipio_preferencial"
                  value="${this.currentUser.municipio_preferencial || ''}"
                  placeholder="Ex.: Lisboa, Porto, Braga..."
                  autocomplete="off" />
                <small class="form-help">
                  Esta preferência será usada para filtrar lojas e preços mais próximos de ti.
                </small>
              </div>
            </form>
          </section>

          <!-- Seção de Ações -->
          <section class="profile-section profile-actions-section">
            <div class="profile-actions">
              <button type="submit" class="profile-btn profile-btn--primary" id="save-profile-btn">
                Guardar Alterações
              </button>
              <button type="button" class="profile-btn profile-btn--secondary" id="cancel-profile-btn">
                Cancelar
              </button>
            </div>
          </section>

        </div>
      </div>
    `;

    this.bindEvents();
    observeNewElements();
  }

  /**
   * Obtém o caminho do avatar do utilizador atual.
   * Retorna o avatar existente ou uma imagem padrão.
   */
  getAvatarSrc() {
    if (this.currentUser?.avatar_path) {
      // Se o caminho não começar com / ou http, adicionar /
      const path = this.currentUser.avatar_path.startsWith('/') 
        ? this.currentUser.avatar_path 
        : '/' + this.currentUser.avatar_path;
      return path;
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23efefef' width='100' height='100'/%3E%3Ctext x='50' y='60' text-anchor='middle' font-size='40' font-weight='600' fill='%23999'%3E%3F%3C/text%3E%3C/svg%3E";
  }

  /**
   * Formata uma data para o formato esperado por input[type="date"] (YYYY-MM-DD)
   * @param {string} dateStr - Data em qualquer formato reconhecido
   * @returns {string} Data no formato YYYY-MM-DD ou string vazia
   */
  formatDateForInput(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  /**
   * Binding de eventos da página:
   *  - Upload de avatar
   *  - Remoção de avatar
   *  - Guardar dados pessoais
   *  - Guardar preferências
   */
  bindEvents() {
    // Upload de Avatar
    const avatarInput = this.container.querySelector("#avatar-input");
    avatarInput?.addEventListener("change", (e) => this.handleAvatarUpload(e));

    // Remoção de Avatar
    const removeAvatarBtn = this.container.querySelector("#remove-avatar-btn");
    removeAvatarBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleRemoveAvatar();
    });

    // Guardar Perfil (dados pessoais + preferências)
    const saveBtn = this.container.querySelector("#save-profile-btn");
    const cancelBtn = this.container.querySelector("#cancel-profile-btn");

    saveBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleSaveProfile();
    });

    cancelBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      router.navigate("/");
    });

    // Permitir submit ao pressionar Enter nas formas
    const profileForm = this.container.querySelector("#profile-form");
    const preferencesForm = this.container.querySelector("#preferences-form");

    profileForm?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.handleSaveProfile();
      }
    });

    preferencesForm?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.handleSaveProfile();
      }
    });
  }

  /**
   * Manipula o upload de um novo avatar.
   * Valida o ficheiro, faz upload para o servidor e actualiza a pré-visualização.
   */
  async handleAvatarUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    // Validação de tamanho
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`Ficheiro muito grande. Máximo: 5MB (enviaste: ${(file.size / 1024 / 1024).toFixed(2)}MB).`);
      event.target.value = "";
      return;
    }

    // Validação de tipo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de ficheiro não suportado. Usa JPG, PNG, WebP ou GIF.");
      event.target.value = "";
      return;
    }

    // Mostrar pré-visualização local
    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarImg = this.container.querySelector("#avatar-image");
      if (avatarImg) {
        avatarImg.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);

    // Fazer upload
    this.isUploadingAvatar = true;
    const saveBtn = this.container.querySelector("#save-profile-btn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "A guardar foto...";
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      // Usar API relativa com suporte automático de detecção de base
      const endpoint = `/api/v1/users/${this.currentUser.id}/upload-avatar`;
      const apiBase = window.localStorage.getItem('price360_api_base') || 
                     `${window.location.origin}/api/v1`;
      const baseUrl = apiBase.replace('/api/v1', '');
      
      const response = await fetch(
        `${baseUrl}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${auth.getToken()}`,
          },
          body: formData,
        }
      );

      const jsonResponse = await response.json();

      if (!response.ok) {
        throw new Error(jsonResponse.message || "Erro ao fazer upload do avatar.");
      }

      // Actualizar utilizador no auth com novo avatar
      this.currentUser = jsonResponse.data.user;
      auth.setAuth(auth.getToken(), this.currentUser);

      // Re-renderizar para mostrar o novo avatar corretamente
      const avatarImg = this.container.querySelector("#avatar-image");
      if (avatarImg) {
        avatarImg.src = this.getAvatarSrc();
      }

      // Mostrar botão de remover foto se não existia
      if (!this.container.querySelector("#remove-avatar-btn")) {
        const actionsDiv = this.container.querySelector(".profile-avatar-actions");
        if (actionsDiv) {
          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "profile-avatar-btn profile-avatar-btn--danger";
          removeBtn.id = "remove-avatar-btn";
          removeBtn.textContent = "Remover";
          removeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            this.handleRemoveAvatar();
          });
          actionsDiv.appendChild(removeBtn);
        }
      }

      toast.success("Avatar guardado com sucesso!");
      event.target.value = "";
    } catch (error) {
      console.error("Erro ao fazer upload de avatar:", error);
      toast.error(error.message || "Falha ao fazer upload da foto.");
      // Reverter preview ao avatar anterior
      const avatarImg = this.container.querySelector("#avatar-image");
      if (avatarImg) {
        avatarImg.src = this.getAvatarSrc();
      }
    } finally {
      this.isUploadingAvatar = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar Alterações";
      }
    }
  }

  /**
   * Remove o avatar do utilizador.
   * Pede confirmação antes de remover.
   */
  async handleRemoveAvatar() {
    if (!confirm("Tem a certeza que quer remover o avatar?")) return;

    try {
      const endpoint = `/api/v1/users/${this.currentUser.id}`;
      const apiBase = window.localStorage.getItem('price360_api_base') || 
                     `${window.location.origin}/api/v1`;
      const baseUrl = apiBase.replace('/api/v1', '');

      const response = await fetch(
        `${baseUrl}${endpoint}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.getToken()}`,
          },
          body: JSON.stringify({ avatar_path: null }),
        }
      );

      const jsonResponse = await response.json();

      if (!response.ok) {
        throw new Error(jsonResponse.message || "Erro ao remover avatar.");
      }

      // Actualizar utilizador no auth
      this.currentUser = jsonResponse.data.user;
      auth.setAuth(auth.getToken(), this.currentUser);

      // Re-renderizar o avatar
      const avatarImg = this.container.querySelector("#avatar-image");
      if (avatarImg) {
        avatarImg.src = this.getAvatarSrc();
      }

      // Remover botão de remover do DOM
      const removeBtn = this.container.querySelector("#remove-avatar-btn");
      removeBtn?.remove();

      toast.success("Avatar removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover avatar:", error);
      toast.error(error.message || "Falha ao remover avatar.");
    }
  }

  /**
   * Guarda as alterações ao perfil do utilizador (dados pessoais + preferências).
   */
  async handleSaveProfile() {
    const profileForm = this.container.querySelector("#profile-form");
    const preferencesForm = this.container.querySelector("#preferences-form");

    if (!profileForm || !preferencesForm) return;

    try {
      // Recolher dados de ambas as formas
      const formDataProfile = new FormData(profileForm);
      const formDataPreferences = new FormData(preferencesForm);

      let updateData = {};

      // Dados pessoais
      for (let [key, value] of formDataProfile.entries()) {
        updateData[key] = value;
      }

      // Preferências
      for (let [key, value] of formDataPreferences.entries()) {
        updateData[key] = value;
      }

      // Filtrar campos vazios para evitar erros de validação da BD
      updateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value?.toString().trim() !== "")
      );

      if (Object.keys(updateData).length === 0) {
        toast.warning("Sem alterações para guardar.");
        return;
      }

      // Chamar API
      const endpoint = `/api/v1/users/${this.currentUser.id}`;
      const apiBase = window.localStorage.getItem('price360_api_base') || 
                     `${window.location.origin}/api/v1`;
      const baseUrl = apiBase.replace('/api/v1', '');

      const response = await fetch(
        `${baseUrl}${endpoint}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.getToken()}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const jsonResponse = await response.json();

      if (!response.ok) {
        throw new Error(jsonResponse.message || "Erro ao guardar dados pessoais.");
      }

      // Actualizar utilizador no auth
      this.currentUser = jsonResponse.data.user;
      auth.setAuth(auth.getToken(), this.currentUser);

      toast.success("Perfil guardado com sucesso!");
    } catch (error) {
      console.error("Erro ao guardar perfil:", error);
      toast.error(error.message || "Falha ao guardar perfil.");
    }
  }
}

export default ProfilePage;
