/**
 * @file components.js
 * @description Renders and initializes shared UI components across all pages:
 * Site Header (Desktop & Mobile Figma layouts), Mobile Dropdown Menu, Marquee Strip,
 * FAQ Accordion, Moving Gradient CTA Section, Site Footer (3-column Figma layout),
 * and automatic Maintenance Mode redirection.
 */

const NAV_ITEMS = [
  { label: 'Home', href: 'index.html', key: 'home' },
  { label: 'Servizi', href: 'servizi.html', key: 'servizi' },
  { label: 'Portfolio', href: 'portfolio.html', key: 'portfolio' },
  { label: 'Team', href: 'team.html', key: 'team' },
  { label: 'Metodo', href: 'metodo.html', key: 'metodo' },
  { label: 'Contatti', href: 'contatti.html', key: 'contatti' },
];

/**
 * Ensures `moving-gradient.js` is loaded and mounts the 3D WebGL2 shader on `.moving-gradient-canvas`.
 */
function ensureMovingGradientLoaded() {
  if (window.EvigMovingGradient) {
    window.EvigMovingGradient.mountAllMovingGradients();
    return;
  }
  if (document.getElementById('evig-moving-gradient-script')) return;
  const s = document.createElement('script');
  s.id = 'evig-moving-gradient-script';
  s.src = 'js/moving-gradient.js';
  s.onload = () => {
    if (window.EvigMovingGradient) {
      window.EvigMovingGradient.mountAllMovingGradients();
    }
  };
  document.head.appendChild(s);
}

/**
 * Injects the shared EvigDog Studio Header and Mobile Menu into `#site-header-mount`.
 * Faithfully reproduces the Figma Desktop Header (left nav, center G+STUDIO monogram, right CONTATTACI button)
 * and Mobile Header (left horizontal EVIG DOG STUDIO logo, right cream hamburger button).
 * @param {string} activeKey - Key of the currently active page.
 */
function renderHeader(activeKey) {
  const mount = document.getElementById('site-header-mount');
  if (!mount) return;

  const linksHtml = NAV_ITEMS.map(
    (item) =>
      `<a href="${item.href}" class="nav-link ${item.key === activeKey ? 'active' : ''}">${item.label}</a>`
  ).join('');

  mount.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <nav class="nav-bar" aria-label="Navigazione principale">
          ${linksHtml}
        </nav>

        <a href="index.html" class="header-logo header-logo-desktop" aria-label="EvigDog Studio Home">
          <img src="/assets/images/logo-monogram-white.svg" alt="EvigDog Studio" width="58" height="55" />
        </a>

        <a href="index.html" class="header-logo header-logo-mobile" aria-label="EvigDog Studio Home">
          <img src="/assets/images/logo-horizontal-white.svg" alt="EvigDog Studio" width="112" height="32" />
        </a>

        <div class="header-cta">
          <a href="contatti.html" class="btn-header-contact">CONTATTACI</a>
          <button type="button" class="mobile-menu-toggle" id="mobile-menu-btn" aria-label="Apri menu" aria-expanded="false">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1H17M1 6H17M1 11H17" stroke="#2F1505" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
    <nav class="mobile-dropdown" id="mobile-dropdown-menu" aria-label="Menu Mobile">
      ${linksHtml}
      <a href="admin.html" class="nav-link ${activeKey === 'admin' ? 'active' : ''}">Area Admin</a>
    </nav>
  `;

  const toggleBtn = document.getElementById('mobile-menu-btn');
  const dropdown = document.getElementById('mobile-dropdown-menu');
  if (toggleBtn && dropdown) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = dropdown.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });
  }
}

/**
 * Injects the shared CTASection (with Moving Gradient background) and 3-column SiteFooter
 * into `#site-footer-mount`, binding the quick email form.
 */
function renderFooter() {
  const mount = document.getElementById('site-footer-mount');
  if (!mount) return;

  mount.innerHTML = `
    <footer class="site-footer">
      <section class="footer-cta-band">
        <canvas class="moving-gradient-canvas" aria-hidden="true"></canvas>
        <div class="footer-cta-inner">
          <div class="footer-cta-card">
            <div class="footer-cta-left">
              <span class="footer-cta-eyebrow">Pronto a Iniziare?</span>
              <h2 class="footer-cta-title">
                Costruiamo <span class="text-terracotta">insieme</span><br />qualcosa di straordinario.
              </h2>
            </div>
            <div class="footer-cta-right">
              <a href="contatti.html" class="btn-footer-cta">INVIA IL MESSAGGIO</a>
              <span class="footer-cta-note">Risposta garantita entro 24 ore</span>
            </div>
          </div>
        </div>
      </section>

      <div class="site-footer-body">
        <div class="footer-watermark" aria-hidden="true">PARLIAMO</div>
        <div class="container">
          <div class="footer-main">
            <div class="footer-col-1">
              <div class="footer-brand">
                <a href="index.html" class="footer-logo-link">
                  <img src="/assets/images/logo-horizontal-gold.svg" alt="EvigDog Studio" width="112" height="32" />
                </a>
                <p>Studio creativo milanese. Brand identity, web design e strategie digitali orientate al risultato.</p>
              </div>
              <nav class="footer-links" aria-label="Link Footer">
                <a href="index.html">Home</a>
                <a href="servizi.html">Servizi</a>
                <a href="portfolio.html">Portfolio</a>
                <a href="team.html">Team</a>
                <a href="metodo.html">Metodo</a>
                <a href="contatti.html">Contatti</a>
              </nav>
            </div>

            <div class="footer-col-2">
              <h3 class="footer-col-title">CONTATTI</h3>
              <div class="footer-contact-list">
                <div class="footer-contact-item">
                  <span class="footer-contact-label">EMAIL</span>
                  <a href="mailto:hello@evigdogstudio.com" class="footer-contact-value">hello@evigdogstudio.com</a>
                </div>
                <div class="footer-contact-item">
                  <span class="footer-contact-label">TELEFONO</span>
                  <a href="tel:+390212345678" class="footer-contact-value">+39 02 1234 5678</a>
                </div>
                <div class="footer-contact-item">
                  <span class="footer-contact-label">INDIRIZZO</span>
                  <span class="footer-contact-value">Via Tortona 37 · Milano</span>
                </div>
              </div>
              <div class="footer-socials">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" class="social-btn" aria-label="LinkedIn">In</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" class="social-btn" aria-label="Instagram">Ig</a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" class="social-btn" aria-label="Facebook">Fb</a>
                <a href="https://behance.net" target="_blank" rel="noreferrer" class="social-btn" aria-label="Behance">Be</a>
              </div>
            </div>

            <div class="footer-col-3">
              <h3 class="footer-col-title">INVIA LA TUA EMAIL</h3>
              <p class="footer-newsletter-desc">Lascia la tua email e ti ricontattiamo entro 24 ore lavorative.</p>
              <form class="footer-newsletter-form" id="footer-newsletter-form">
                <input
                  type="email"
                  id="footer-email-input"
                  class="footer-input"
                  placeholder="La tua email"
                  required
                  aria-label="La tua email"
                />
                <button type="submit" class="btn-footer-submit">INVIA IL MESSAGGIO</button>
                <div id="footer-newsletter-msg" style="font-size: 13px; margin-top: 6px;"></div>
              </form>
            </div>
          </div>

          <div class="footer-bottom">
            <span>© 2026 Evigdog Studio · Tutti i diritti riservati</span>
            <div class="footer-legal">
              <a href="contatti.html">Privacy</a>
              <a href="contatti.html">Cookie</a>
              <a href="manutenzione.html">Manutenzione</a>
              <a href="admin.html">Admin</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `;

  ensureMovingGradientLoaded();

  const form = document.getElementById('footer-newsletter-form');
  const emailInput = document.getElementById('footer-email-input');
  const msgEl = document.getElementById('footer-newsletter-msg');

  if (form && emailInput && msgEl) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgEl.textContent = 'Invio in corso...';
      msgEl.style.color = '#EDCD91';
      try {
        await window.EvigApi.submitNewsletter(emailInput.value, `Footer (${document.title})`);
        msgEl.textContent = 'Grazie! Email registrata correttamente.';
        msgEl.style.color = '#9ae6b4';
        emailInput.value = '';
      } catch (err) {
        msgEl.textContent = err.message || 'Errore durante l’invio.';
        msgEl.style.color = '#feb2b2';
      }
    });
  }
}

/**
 * Renders the scrolling MarqueeStrip inside any `.marquee-mount` element.
 */
function renderMarqueeStrips() {
  const mounts = document.querySelectorAll('.marquee-mount');
  if (!mounts.length) return;

  const disciplines = [
    'Brand Identity',
    'Web Design',
    'UI/UX Design',
    'Motion & 3D',
    'Marketing',
    'Fotografia & Video',
  ];

  const repeated = [...disciplines, ...disciplines, ...disciplines, ...disciplines];
  const trackHtml = repeated
    .map((label) => `<div class="marquee-item"><span>${label}</span><span class="marquee-sep"></span></div>`)
    .join('');

  mounts.forEach((mount) => {
    mount.innerHTML = `
      <div class="marquee-strip" aria-hidden="true">
        <div class="marquee-track">${trackHtml}</div>
      </div>
    `;
  });
}

/**
 * Loads FAQs from the Backend API (`/api/faqs`) and renders interactive accordions
 * into `#faq-list-mount`. Respects `data-show-numbers="false"` on Contatti page.
 */
async function loadAndRenderFaqs() {
  const mount = document.getElementById('faq-list-mount');
  if (!mount) return;

  const showNumbers = mount.getAttribute('data-show-numbers') !== 'false';

  try {
    const faqs = await window.EvigApi.getFaqs();
    mount.innerHTML = faqs
      .map(
        (faq, idx) => `
        <div class="faq-item ${idx === 0 ? 'open' : ''}">
          <button type="button" class="faq-trigger" aria-expanded="${idx === 0 ? 'true' : 'false'}">
            ${showNumbers ? `<span class="faq-number">${faq.code}</span>` : ''}
            <span class="faq-question">${faq.question}</span>
            <span class="faq-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 1V13M1 7H13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </span>
          </button>
          <div class="faq-answer">
            <p>${faq.answer}</p>
          </div>
        </div>
      `
      )
      .join('');

    mount.querySelectorAll('.faq-trigger').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
  } catch (err) {
    console.error('Failed to load FAQs:', err);
  }
}

/**
 * Checks if the Backend has Maintenance Mode enabled. If enabled on a public page,
 * redirects the visitor to `manutenzione.html`.
 * @param {string} activeKey - Current page identifier.
 */
async function checkMaintenanceGate(activeKey) {
  if (activeKey === 'admin' || activeKey === 'manutenzione') return;
  try {
    const status = await window.EvigApi.getStatus();
    if (status && status.maintenanceMode) {
      window.location.href = 'manutenzione.html';
    }
  } catch (_e) {
    // Ignore status errors during offline browsing
  }
}

window.EvigComponents = {
  initSharedLayout: (activeKey) => {
    renderHeader(activeKey);
    renderFooter();
    renderMarqueeStrips();
    loadAndRenderFaqs();
    checkMaintenanceGate(activeKey);
  },
};
