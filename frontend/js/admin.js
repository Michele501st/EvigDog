/**
 * @file admin.js
 * @description Controller for the EvigDog Studio Admin Dashboard (`admin.html`).
 * Handles RBAC authentication (SuperAdmin / Admin), profile credential updates,
 * user provisioning (exclusive to SuperAdmin), real-time maintenance toggle,
 * and contact / newsletter submissions moderation.
 */

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - Raw input string.
 * @returns {string} Sanitized string.
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats an ISO timestamp into a readable Italian date/time representation.
 * @param {string} iso - ISO date string.
 * @returns {string} Human-friendly formatted date.
 */
function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_e) {
    return iso;
  }
}

/**
 * Displays an error or success message in a designated alert container.
 * @param {HTMLElement} element - Alert container element.
 * @param {string} message - Text to display.
 * @param {'error'|'success'} [type='error'] - Message kind.
 */
function showAlert(element, message, type = 'error') {
  if (!element) return;
  if (!message) {
    element.style.display = 'none';
    element.textContent = '';
    return;
  }
  element.style.display = 'block';
  element.textContent = message;
  if (type === 'success') {
    element.style.background = 'rgba(72, 187, 120, 0.15)';
    element.style.borderColor = '#48bb78';
    element.style.color = '#9ae6b4';
  } else {
    element.style.background = 'rgba(245, 101, 101, 0.15)';
    element.style.borderColor = '#f56565';
    element.style.color = '#feb2b2';
  }
}

/**
 * Initializes the Admin Dashboard UI, authentication flow, and operational listeners.
 */
function initAdminDashboard() {
  // Views
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');

  // Login View Elements
  const loginForm = document.getElementById('admin-login-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const loginErrorAlert = document.getElementById('login-error-alert');
  const loginSubmitBtn = document.getElementById('btn-login-submit');

  // Topbar & Profile Elements
  const currentUsernameEl = document.getElementById('admin-current-username');
  const currentRoleBadgeEl = document.getElementById('admin-current-role-badge');
  const btnOpenProfile = document.getElementById('btn-open-profile');
  const btnAdminLogout = document.getElementById('btn-admin-logout');

  // Profile Modal Elements
  const profileModal = document.getElementById('admin-profile-modal');
  const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
  const btnCancelProfile = document.getElementById('btn-cancel-profile');
  const profileForm = document.getElementById('admin-profile-form');
  const profileUsernameInput = document.getElementById('profile-username');
  const profileCurrentPasswordInput = document.getElementById('profile-current-password');
  const profileNewPasswordInput = document.getElementById('profile-new-password');
  const profileConfirmPasswordInput = document.getElementById('profile-confirm-password');
  const profileStatusAlert = document.getElementById('profile-status-alert');

  // SuperAdmin User Management Elements
  const superadminUsersPanel = document.getElementById('superadmin-users-panel');
  const adminUsersTbody = document.getElementById('admin-users-tbody');
  const createUserForm = document.getElementById('create-user-form');
  const newUsernameInput = document.getElementById('new-user-username');
  const newPasswordInput = document.getElementById('new-user-password');
  const newRoleSelect = document.getElementById('new-user-role');
  const usersAlertBox = document.getElementById('users-alert-box');

  // Operational Dashboard Elements
  const statTotalMsg = document.getElementById('stat-total-msg');
  const statNewMsg = document.getElementById('stat-new-msg');
  const statNewsletter = document.getElementById('stat-newsletter');
  const statDbMode = document.getElementById('stat-db-mode');
  const containerHostEl = document.getElementById('container-host-info');
  const maintBadge = document.getElementById('maint-status-badge');
  const toggleMaintBtn = document.getElementById('toggle-maintenance-btn');

  const statusFilter = document.getElementById('admin-status-filter');
  const refreshBtn = document.getElementById('admin-refresh-btn');
  const messagesListEl = document.getElementById('admin-messages-list');
  const newsletterListEl = document.getElementById('admin-newsletter-list');

  let currentUser = null;
  let currentMaintenanceMode = false;

  /**
   * Switches the UI between unauthenticated Login screen and authenticated Dashboard.
   * @param {boolean} isAuthenticated - Whether a valid session exists.
   */
  function setAuthenticatedState(isAuthenticated) {
    if (isAuthenticated) {
      if (loginView) loginView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'block';
    } else {
      currentUser = null;
      if (dashboardView) dashboardView.style.display = 'none';
      if (loginView) loginView.style.display = 'block';
      if (loginPasswordInput) loginPasswordInput.value = '';
      showAlert(loginErrorAlert, '');
    }
  }

  /**
   * Validates active session and loads all required dashboard data.
   */
  async function checkSessionAndLoad() {
    try {
      const meResponse = await window.EvigApi.getMe();
      if (meResponse && meResponse.user) {
        currentUser = meResponse.user;
        updateUserHeader(currentUser);
        setAuthenticatedState(true);
        await Promise.all([
          loadDashboardData(),
          currentUser.role === 'superadmin' ? loadUsersList() : Promise.resolve(),
        ]);
      } else {
        setAuthenticatedState(false);
      }
    } catch (_err) {
      setAuthenticatedState(false);
    }
  }

  /**
   * Updates topbar username display and SuperAdmin visibility.
   * @param {{ id: string, username: string, role: string }} user - Logged user.
   */
  function updateUserHeader(user) {
    if (currentUsernameEl) currentUsernameEl.textContent = user.username;
    if (currentRoleBadgeEl) {
      currentRoleBadgeEl.textContent = user.role.toUpperCase();
      currentRoleBadgeEl.className =
        user.role === 'superadmin' ? 'role-badge-superadmin' : 'role-badge-admin';
    }
    if (superadminUsersPanel) {
      superadminUsersPanel.style.display = user.role === 'superadmin' ? 'block' : 'none';
    }
  }

  /**
   * Fetches container health, contacts, and newsletter leads.
   */
  async function loadDashboardData() {
    const selectedStatus = statusFilter ? statusFilter.value : 'tutti';

    try {
      const [health, contacts, leads] = await Promise.all([
        window.EvigApi.getHealth(),
        window.EvigApi.getContacts(selectedStatus),
        window.EvigApi.getNewsletterLeads(),
      ]);

      currentMaintenanceMode = Boolean(health.maintenanceMode);

      if (statDbMode) {
        statDbMode.textContent =
          health.database?.mode === 'mongodb' ? 'MongoDB 7 (Container)' : 'JSON Store (Locale)';
      }
      if (containerHostEl) {
        containerHostEl.textContent = `Host: ${health.hostname} · Uptime: ${health.uptimeSeconds}s · RAM RSS: ${health.memoryMB?.rss} MB`;
      }

      if (maintBadge) {
        maintBadge.textContent = currentMaintenanceMode
          ? 'ATTIVA (Sito in Manutenzione)'
          : 'ONLINE (Sito Pubblico Regolare)';
        maintBadge.className = `status-badge ${
          currentMaintenanceMode ? 'status-in_lavorazione' : 'status-completato'
        }`;
      }

      if (toggleMaintBtn) {
        toggleMaintBtn.textContent = currentMaintenanceMode
          ? 'Disattiva Manutenzione (Torna Online)'
          : 'Attiva Modalità Manutenzione';
      }

      if (statTotalMsg) statTotalMsg.textContent = String(contacts.length);
      if (statNewMsg) {
        statNewMsg.textContent = String(contacts.filter((c) => c.status === 'nuovo').length);
      }
      if (statNewsletter) statNewsletter.textContent = String(leads.length);

      renderContacts(contacts);
      renderNewsletter(leads);
    } catch (err) {
      console.error('[Admin] Failed to load dashboard data:', err);
      if (err.message && err.message.includes('401')) {
        setAuthenticatedState(false);
      }
    }
  }

  /**
   * Renders the Contact Form inquiries table.
   * @param {Array<object>} contacts - Submissions list.
   */
  function renderContacts(contacts) {
    if (!messagesListEl) return;
    if (!contacts.length) {
      messagesListEl.innerHTML = `<p style="color: var(--text-muted-light); padding: 16px 0;">Nessun messaggio presente per il filtro selezionato.</p>`;
      return;
    }

    const statusLabels = {
      nuovo: 'Nuovo',
      in_lavorazione: 'In Lavorazione',
      completato: 'Completato',
    };

    messagesListEl.innerHTML = contacts
      .map(
        (c) => `
        <article class="admin-msg-card" data-id="${escapeHtml(c.id)}">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;">
              <span class="status-badge status-${escapeHtml(c.status)}">${
          statusLabels[c.status] || escapeHtml(c.status)
        }</span>
              <strong style="font-size: 19px; color: var(--text-cream);">${escapeHtml(
                c.name
              )}</strong>
              <a href="mailto:${escapeHtml(c.email)}" style="color: var(--accent-gold); font-size: 14px;">
                ${escapeHtml(c.email)}
              </a>
              <span style="font-size: 12px; color: var(--text-muted-light);">
                · ${formatDate(c.createdAt)} (ID: ${escapeHtml(c.id)})
              </span>
            </div>

            <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 12px; font-size: 13px; color: var(--text-beige);">
              <span><strong>Area Progetto:</strong> ${escapeHtml(c.projectType)}</span>
              <span><strong>Budget Indicativo:</strong> ${escapeHtml(c.budget)}</span>
            </div>

            <p style="color: var(--text-cream); background: rgba(255,255,255,0.03); padding: 14px; border-left: 2px solid var(--accent-gold); line-height: 1.6;">
              ${escapeHtml(c.message)}
            </p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; min-width: 185px;">
            <label class="form-label" style="font-size: 10px;">Aggiorna Stato</label>
            <select class="form-select msg-status-select" data-id="${escapeHtml(
              c.id
            )}" style="border: 1px solid var(--border-gold-medium); padding: 8px 10px; font-size: 13px;">
              <option value="nuovo" ${c.status === 'nuovo' ? 'selected' : ''}>Nuovo</option>
              <option value="in_lavorazione" ${
                c.status === 'in_lavorazione' ? 'selected' : ''
              }>In Lavorazione</option>
              <option value="completato" ${
                c.status === 'completato' ? 'selected' : ''
              }>Completato</option>
            </select>
            <button type="button" class="btn btn-outline btn-sm msg-delete-btn" data-id="${escapeHtml(
              c.id
            )}" style="border-color: rgba(245, 101, 101, 0.45); color: #feb2b2;">
              Elimina Messaggio
            </button>
          </div>
        </article>
      `
      )
      .join('');

    messagesListEl.querySelectorAll('.msg-status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.getAttribute('data-id');
        try {
          await window.EvigApi.updateContactStatus(id, sel.value);
          await loadDashboardData();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    messagesListEl.querySelectorAll('.msg-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Sei sicuro di voler eliminare questa richiesta di contatto?')) return;
        const id = btn.getAttribute('data-id');
        try {
          await window.EvigApi.deleteContact(id);
          await loadDashboardData();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  /**
   * Renders the footer newsletter leads list.
   * @param {Array<object>} leads - Collected emails.
   */
  function renderNewsletter(leads) {
    if (!newsletterListEl) return;
    if (!leads.length) {
      newsletterListEl.innerHTML = `<p style="color: var(--text-muted-light); padding: 12px 0;">Nessuna email registrata dal Footer.</p>`;
      return;
    }

    newsletterListEl.innerHTML = leads
      .map(
        (lead) => `
        <div class="contact-info-row" style="padding: 14px 0;">
          <div>
            <strong style="color: var(--text-cream);">${escapeHtml(lead.email)}</strong>
            <span style="font-size: 12px; color: var(--text-muted-light); margin-left: 12px;">
              ${escapeHtml(lead.source)} · ${formatDate(lead.createdAt)}
            </span>
          </div>
          <button type="button" class="btn btn-outline btn-sm lead-delete-btn" data-id="${escapeHtml(
            lead.id
          )}" style="padding: 6px 12px; font-size: 11px; border-color: rgba(245, 101, 101, 0.45); color: #feb2b2;">
            Rimuovi
          </button>
        </div>
      `
      )
      .join('');

    newsletterListEl.querySelectorAll('.lead-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Rimuovere questa email dai contatti newsletter?')) return;
        const id = btn.getAttribute('data-id');
        try {
          await window.EvigApi.deleteNewsletterLead(id);
          await loadDashboardData();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  /**
   * Loads and renders administrator accounts for SuperAdmin review.
   */
  async function loadUsersList() {
    if (!adminUsersTbody) return;
    try {
      const response = await window.EvigApi.getUsers();
      const users = response.users || [];

      if (!users.length) {
        adminUsersTbody.innerHTML = `<tr><td colspan="4" style="color: var(--text-muted-light);">Nessun utente trovato.</td></tr>`;
        return;
      }

      adminUsersTbody.innerHTML = users
        .map((u) => {
          const isCurrent = currentUser && currentUser.id === u.id;
          const roleBadgeClass =
            u.role === 'superadmin' ? 'role-badge-superadmin' : 'role-badge-admin';

          return `
            <tr data-user-id="${escapeHtml(u.id)}">
              <td>
                <strong>${escapeHtml(u.username)}</strong>
                ${isCurrent ? '<span style="font-size: 11px; color: var(--accent-gold); margin-left: 8px;">(Tu)</span>' : ''}
              </td>
              <td><span class="${roleBadgeClass}">${escapeHtml(u.role).toUpperCase()}</span></td>
              <td style="color: var(--text-muted-light); font-size: 13px;">${formatDate(u.createdAt)}</td>
              <td style="text-align: right;">
                ${
                  isCurrent
                    ? '<span style="font-size: 12px; color: var(--text-muted-light);">In uso</span>'
                    : `<button type="button" class="btn btn-outline btn-sm delete-user-btn" data-id="${escapeHtml(
                        u.id
                      )}" data-username="${escapeHtml(u.username)}" style="border-color: rgba(245, 101, 101, 0.45); color: #feb2b2; padding: 4px 10px; font-size: 11px;">
                        Elimina
                      </button>`
                }
              </td>
            </tr>
          `;
        })
        .join('');

      adminUsersTbody.querySelectorAll('.delete-user-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-username');
          if (!confirm(`Sei sicuro di voler revocare e rimuovere l'account "${name}"?`)) return;

          try {
            await window.EvigApi.deleteUser(id);
            showAlert(usersAlertBox, `Utente "${name}" eliminato con successo.`, 'success');
            await loadUsersList();
          } catch (err) {
            showAlert(usersAlertBox, err.message, 'error');
          }
        });
      });
    } catch (err) {
      console.error('[Admin] Failed to load users:', err);
      showAlert(usersAlertBox, err.message, 'error');
    }
  }

  // =========================================================================
  // Event Listeners: Login Form
  // =========================================================================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = loginUsernameInput.value.trim();
      const password = loginPasswordInput.value;

      if (!username || !password) {
        showAlert(loginErrorAlert, 'Inserisci username e password.', 'error');
        return;
      }

      try {
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = true;
          loginSubmitBtn.textContent = 'Autenticazione in corso...';
        }

        const res = await window.EvigApi.login(username, password);
        currentUser = res.user;
        updateUserHeader(currentUser);
        setAuthenticatedState(true);
        await Promise.all([
          loadDashboardData(),
          currentUser.role === 'superadmin' ? loadUsersList() : Promise.resolve(),
        ]);
      } catch (err) {
        showAlert(loginErrorAlert, err.message || 'Credenziali non valide.', 'error');
      } finally {
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.textContent = 'Accedi alla Dashboard';
        }
      }
    });
  }

  // =========================================================================
  // Event Listeners: Logout
  // =========================================================================
  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', async () => {
      await window.EvigApi.logout();
      setAuthenticatedState(false);
    });
  }

  // =========================================================================
  // Event Listeners: Profile Modal
  // =========================================================================
  function openProfileModal() {
    if (!profileModal || !currentUser) return;
    profileUsernameInput.value = currentUser.username;
    profileCurrentPasswordInput.value = '';
    profileNewPasswordInput.value = '';
    profileConfirmPasswordInput.value = '';
    showAlert(profileStatusAlert, '');
    profileModal.classList.add('is-open');
  }

  function closeProfileModal() {
    if (!profileModal) return;
    profileModal.classList.remove('is-open');
  }

  if (btnOpenProfile) btnOpenProfile.addEventListener('click', openProfileModal);
  if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', closeProfileModal);
  if (btnCancelProfile) btnCancelProfile.addEventListener('click', closeProfileModal);

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newUsername = profileUsernameInput.value.trim();
      const currentPassword = profileCurrentPasswordInput.value;
      const newPassword = profileNewPasswordInput.value;
      const confirmPassword = profileConfirmPasswordInput.value;

      if (newPassword || confirmPassword) {
        if (!currentPassword) {
          showAlert(
            profileStatusAlert,
            'Inserisci la password attuale per autorizzare la nuova password.',
            'error'
          );
          return;
        }
        if (newPassword !== confirmPassword) {
          showAlert(
            profileStatusAlert,
            'La nuova password e la conferma non coincidono.',
            'error'
          );
          return;
        }
        if (newPassword.length < 6) {
          showAlert(
            profileStatusAlert,
            'La nuova password deve contenere almeno 6 caratteri.',
            'error'
          );
          return;
        }
      }

      try {
        const payload = { newUsername };
        if (newPassword) {
          payload.currentPassword = currentPassword;
          payload.newPassword = newPassword;
        }

        const res = await window.EvigApi.updateProfile(payload);
        currentUser = res.user;
        updateUserHeader(currentUser);
        showAlert(profileStatusAlert, 'Profilo aggiornato con successo!', 'success');

        setTimeout(() => {
          closeProfileModal();
          if (currentUser.role === 'superadmin') {
            loadUsersList();
          }
        }, 900);
      } catch (err) {
        showAlert(profileStatusAlert, err.message, 'error');
      }
    });
  }

  // =========================================================================
  // Event Listeners: SuperAdmin Create User
  // =========================================================================
  if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = newUsernameInput.value.trim();
      const password = newPasswordInput.value;
      const role = newRoleSelect ? newRoleSelect.value : 'admin';

      try {
        await window.EvigApi.createUser({ username, password, role });
        newUsernameInput.value = '';
        newPasswordInput.value = '';
        showAlert(usersAlertBox, `Nuovo ${role} "${username}" creato con successo!`, 'success');
        await loadUsersList();
      } catch (err) {
        showAlert(usersAlertBox, err.message, 'error');
      }
    });
  }

  // =========================================================================
  // Event Listeners: Operational Dashboard Controls
  // =========================================================================
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadDashboardData());
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadDashboardData());
  }

  if (toggleMaintBtn) {
    toggleMaintBtn.addEventListener('click', async () => {
      try {
        await window.EvigApi.setMaintenanceStatus(!currentMaintenanceMode);
        await loadDashboardData();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Esegui verifica iniziale della sessione
  checkSessionAndLoad();
}

window.EvigAdmin = { initAdminDashboard };
