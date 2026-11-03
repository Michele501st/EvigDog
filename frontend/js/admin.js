/**
 * @file admin.js
 * @description Controller for the EvigDog Studio Admin Dashboard (`admin.html`).
 * Allows checking Cloud container health, toggling Maintenance Mode in real time,
 * and viewing, filtering, updating status, or deleting Contact Form & Newsletter submissions.
 */

const STORAGE_KEY = 'evigdog_admin_code';

/**
 * Escapes HTML special characters to prevent XSS when rendering user-submitted messages.
 * @param {string} str - Raw string.
 * @returns {string} Safe HTML string.
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
 * Formats an ISO timestamp into a readable Italian date/time string.
 * @param {string} iso - ISO date string.
 * @returns {string} Formatted date string.
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
 * Initializes the Admin Dashboard UI and event listeners.
 */
function initAdminDashboard() {
  const authForm = document.getElementById('admin-auth-form');
  const codeInput = document.getElementById('admin-code-input');
  const authStatus = document.getElementById('admin-auth-status');
  const statusFilter = document.getElementById('admin-status-filter');
  const refreshBtn = document.getElementById('admin-refresh-btn');
  const toggleMaintBtn = document.getElementById('toggle-maintenance-btn');

  const statTotalMsg = document.getElementById('stat-total-msg');
  const statNewMsg = document.getElementById('stat-new-msg');
  const statNewsletter = document.getElementById('stat-newsletter');
  const statDbMode = document.getElementById('stat-db-mode');
  const containerHostEl = document.getElementById('container-host-info');
  const maintBadge = document.getElementById('maint-status-badge');

  const messagesListEl = document.getElementById('admin-messages-list');
  const newsletterListEl = document.getElementById('admin-newsletter-list');

  let currentAdminCode = sessionStorage.getItem(STORAGE_KEY) || 'evigdog-admin-2026';
  let currentMaintenanceMode = false;

  if (codeInput) {
    codeInput.value = currentAdminCode;
  }

  /**
   * Loads container health, contact messages, and newsletter leads from the Backend.
   */
  async function loadDashboardData() {
    const selectedStatus = statusFilter ? statusFilter.value : 'tutti';

    try {
      const [health, contacts, leads] = await Promise.all([
        window.EvigApi.getHealth(),
        window.EvigApi.getContacts(selectedStatus, currentAdminCode),
        window.EvigApi.getNewsletterLeads(currentAdminCode),
      ]);

      if (authStatus) {
        authStatus.textContent = 'Connesso e autenticato';
        authStatus.style.color = '#9ae6b4';
      }

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
      if (authStatus) {
        authStatus.textContent = err.message || 'Codice Admin non valido.';
        authStatus.style.color = '#feb2b2';
      }
      if (messagesListEl) {
        messagesListEl.innerHTML = `<p style="color: #feb2b2;">${escapeHtml(err.message)}</p>`;
      }
    }
  }

  /**
   * Renders the list of Contact Form inquiries with status controls and delete button.
   * @param {Array<object>} contacts - Array of contact messages.
   */
  function renderContacts(contacts) {
    if (!messagesListEl) return;
    if (!contacts.length) {
      messagesListEl.innerHTML = `<p style="color: var(--text-muted-light);">Nessun messaggio presente per il filtro selezionato.</p>`;
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
          await window.EvigApi.updateContactStatus(id, sel.value, currentAdminCode);
          await loadDashboardData();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    messagesListEl.querySelectorAll('.msg-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          await window.EvigApi.deleteContact(id, currentAdminCode);
          await loadDashboardData();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  /**
   * Renders the list of Footer Newsletter / quick contact email leads.
   * @param {Array<object>} leads - Array of email leads.
   */
  function renderNewsletter(leads) {
    if (!newsletterListEl) return;
    if (!leads.length) {
      newsletterListEl.innerHTML = `<p style="color: var(--text-muted-light);">Nessuna email registrata dal Footer.</p>`;
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
          )}" style="padding: 6px 12px; font-size: 11px;">
            Rimuovi
          </button>
        </div>
      `
      )
      .join('');

    newsletterListEl.querySelectorAll('.lead-delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          await window.EvigApi.deleteNewsletterLead(id, currentAdminCode);
          await loadDashboardData();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  if (authForm && codeInput) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentAdminCode = codeInput.value.trim();
      sessionStorage.setItem(STORAGE_KEY, currentAdminCode);
      loadDashboardData();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadDashboardData());
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadDashboardData());
  }

  if (toggleMaintBtn) {
    toggleMaintBtn.addEventListener('click', async () => {
      try {
        await window.EvigApi.setMaintenanceStatus(!currentMaintenanceMode, currentAdminCode);
        await loadDashboardData();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  loadDashboardData();
}

window.EvigAdmin = { initAdminDashboard };

