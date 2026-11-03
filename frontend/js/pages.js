/**
 * @file pages.js
 * @description Page-level controllers that fetch dynamic data from the Backend APIs
 * (/api/projects, /api/services, /api/team, /api/contacts) and render 1:1 Figma-aligned
 * layouts, SVG icons, interactive filters, team thumbnail carousels, and forms.
 */

const HOME_SERVICE_ICONS = [
  // 01 Brand Identity — 3 rounded squares + 1 circle
  `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="11" height="11" rx="1.5" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="18" y="3" width="11" height="11" rx="1.5" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="3" y="18" width="11" height="11" rx="1.5" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="23.5" cy="23.5" r="5.5" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  // 02 Web Design & Dev — Monitor with chart line
  `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="28" height="19" rx="2" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 29H22M16 29V24" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 13L12 17L16 12L21 18" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  // 03 UI/UX Design — Mobile screen with top lines
  `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="2" width="14" height="24" rx="2" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 7H20M12 11H17" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  // 04 Motion & 3D — Isometric 3D cube
  `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3L3 10V22L16 29L29 22V10L16 3Z" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 3V16M16 16V29M16 16L3 10M16 16L29 10" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  // 05 Strategia & Marketing — Globe with meridians
  `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="13" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 16C8 11 11 7 16 3C21 7 24 11 24 16C24 21 21 25 16 29C11 25 8 21 8 16ZM3 16H29" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  // 06 Fotografia & Video — Landscape mountains + sun
  `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 24L12 15L17 20L21 15L28 24H4Z" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="22" cy="10" r="4" stroke="#EDCD91" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
];

/**
 * Generates HTML markup for a portfolio project card matching Figma's 4px #6D5346 border
 * and #2F1505 bottom bar with "Scopri di più" button.
 * @param {object} project - Project document from the database.
 * @returns {string} HTML string.
 */
function createProjectCardHtml(project) {
  return `
    <article class="project-card" data-category="${project.category}">
      <div class="project-img-wrap">
        <img src="${project.image}" alt="${project.title}" loading="lazy" />
      </div>
      <div class="project-info">
        <div class="project-info-text">
          <p class="project-tagline">${project.tagline}</p>
          <h3 class="project-title">${project.title}</h3>
        </div>
        <a href="portfolio.html" class="btn-project-more">Scopri di più</a>
      </div>
    </article>
  `;
}

/**
 * Initializes the Homepage dynamic sections (Selected Projects, Services, Team preview).
 */
async function initHomepage() {
  const projectsMount = document.getElementById('home-projects-grid');
  const servicesMount = document.getElementById('home-services-grid');
  const teamMount = document.getElementById('home-team-grid');

  try {
    const [projects, services, team] = await Promise.all([
      window.EvigApi.getProjects(),
      window.EvigApi.getServices(),
      window.EvigApi.getTeam(),
    ]);

    if (projectsMount) {
      projectsMount.innerHTML = projects.slice(0, 6).map(createProjectCardHtml).join('');
    }

    if (servicesMount) {
      servicesMount.innerHTML = services
        .slice(0, 6)
        .map(
          (srv, idx) => `
          <article class="service-overview-card">
            <div class="service-overview-icon" aria-hidden="true">
              ${HOME_SERVICE_ICONS[idx % HOME_SERVICE_ICONS.length]}
            </div>
            <h3 class="service-overview-title">${srv.title}</h3>
            <p class="service-overview-desc">${srv.description}</p>
          </article>
        `
        )
        .join('');
    }

    if (teamMount) {
      teamMount.innerHTML = team
        .slice(0, 4)
        .map(
          (m) => `
          <article class="team-mini-card">
            <div class="team-mini-img-wrap">
              <img src="${m.image}" alt="${m.name}" loading="lazy" />
            </div>
            <div class="team-mini-meta">
              <h3 class="team-mini-name">${m.name}</h3>
              <p class="team-mini-role">${m.role}</p>
            </div>
          </article>
        `
        )
        .join('');
    }
  } catch (err) {
    console.error('Error initializing Homepage data:', err);
  }
}

/**
 * Initializes the Servizi page (`servizi.html`) by rendering all 6 services
 * in the exact 3-column Figma structure:
 * Col 1: Number (01..06)
 * Col 2: Title (#EDCD91) + Tag pills below it
 * Col 3: Description + "Scopri di più →" below it
 */
async function initServiziPage() {
  const listMount = document.getElementById('services-detail-mount');
  if (!listMount) return;

  try {
    const services = await window.EvigApi.getServices();
    listMount.innerHTML = services
      .map(
        (srv) => `
        <article class="service-detail-row">
          <div class="service-detail-num">${srv.number}</div>
          <div class="service-detail-col-title">
            <h3 class="service-detail-title">${srv.title}</h3>
            <div class="service-tags">
              ${srv.tags.map((t) => `<span class="service-tag">${t}</span>`).join('')}
            </div>
          </div>
          <div class="service-detail-body">
            <p class="service-detail-desc">${srv.description}</p>
            <a href="contatti.html?service=${encodeURIComponent(srv.title)}" class="service-detail-cta">
              <span>Scopri di più</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        </article>
      `
      )
      .join('');
  } catch (err) {
    console.error('Error loading services:', err);
  }
}

/**
 * Initializes the Portfolio page (`portfolio.html`) with live category filter buttons
 * and the Featured Case Study section matching Figma's 2-column split.
 */
async function initPortfolioPage() {
  const gridMount = document.getElementById('portfolio-projects-grid');
  const featuredMount = document.getElementById('featured-project-mount');
  const filterBtns = document.querySelectorAll('.filter-btn');

  async function renderFilteredProjects(category = 'Tutti') {
    if (!gridMount) return;
    const projects = await window.EvigApi.getProjects(category);
    gridMount.innerHTML = projects.map(createProjectCardHtml).join('');
  }

  try {
    const allProjects = await window.EvigApi.getProjects('Tutti');
    if (gridMount) {
      gridMount.innerHTML = allProjects.map(createProjectCardHtml).join('');
    }

    const featured = allProjects.find((p) => p.featured) || allProjects[0];
    if (featured && featuredMount) {
      featuredMount.innerHTML = `
        <div class="featured-project-box">
          <div class="featured-project-img">
            <img src="${featured.image}" alt="${featured.title}" />
            <div class="featured-project-img-overlay"></div>
          </div>
          <div class="featured-project-content">
            <div class="featured-project-top">
              <div class="featured-meta-line">
                <span class="featured-cat">${featured.category}</span>
                <span class="featured-line"></span>
                <span class="featured-year">${featured.year}</span>
              </div>
              <h3 class="featured-title">${featured.title}</h3>
              <p class="featured-desc">${featured.description}</p>
              <div class="service-tags">
                ${(featured.deliverables || [])
                  .map((d) => `<span class="service-tag">${d}</span>`)
                  .join('')}
              </div>
            </div>
            <a href="contatti.html" class="btn-featured-cta">Scopri di più</a>
          </div>
        </div>
      `;
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-filter') || 'Tutti';
        renderFilteredProjects(cat);
      });
    });
  } catch (err) {
    console.error('Error initializing Portfolio page:', err);
  }
}

/**
 * Initializes the Team page (`team.html`) including the interactive 5-member Hero Carousel
 * (with top indicator pills + bottom 5-thumbnail strip) and the borderless-avatar Team Directory.
 */
async function initTeamPage() {
  const dirMount = document.getElementById('team-directory-mount');
  const dotsMount = document.getElementById('team-slider-dots');
  const thumbsMount = document.getElementById('team-thumbs-strip');
  const roleEl = document.getElementById('slide-member-role');
  const sinceEl = document.getElementById('slide-member-since');
  const nameEl = document.getElementById('slide-member-name');
  const quoteEl = document.getElementById('slide-member-quote');
  const counterEl = document.getElementById('slide-member-counter');
  const imgEl = document.getElementById('slide-member-img');
  const prevBtn = document.getElementById('team-prev-btn');
  const nextBtn = document.getElementById('team-next-btn');

  try {
    const members = await window.EvigApi.getTeam();
    if (!members.length) return;

    let currentIndex = 0;

    function renderActiveSlide(idx) {
      currentIndex = (idx + members.length) % members.length;
      const m = members[currentIndex];
      if (roleEl) roleEl.textContent = m.role;
      if (sinceEl) sinceEl.textContent = m.since;
      if (nameEl) nameEl.textContent = m.name;
      if (quoteEl) quoteEl.textContent = `“${m.quote.replace(/^[“"]|[”"]$/g, '')}”`;
      if (counterEl) {
        counterEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(
          members.length
        ).padStart(2, '0')}`;
      }
      if (imgEl) {
        imgEl.src = m.image;
        imgEl.alt = m.name;
      }
      if (dotsMount) {
        dotsMount.querySelectorAll('.team-dot').forEach((d, i) => {
          d.classList.toggle('active', i === currentIndex);
        });
      }
      if (thumbsMount) {
        thumbsMount.querySelectorAll('.team-thumb-btn').forEach((t, i) => {
          t.classList.toggle('active', i === currentIndex);
        });
      }
    }

    if (dotsMount) {
      dotsMount.innerHTML = members
        .map(
          (m, i) =>
            `<button type="button" class="team-dot ${i === 0 ? 'active' : ''}" aria-label="Vai a ${m.name}" data-index="${i}"></button>`
        )
        .join('');
      dotsMount.querySelectorAll('.team-dot').forEach((dot) => {
        dot.addEventListener('click', () => {
          renderActiveSlide(Number(dot.getAttribute('data-index')));
        });
      });
    }

    if (thumbsMount) {
      thumbsMount.innerHTML = members
        .map(
          (m, i) => `
          <button type="button" class="team-thumb-btn ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="${m.name}">
            <img src="${m.image}" alt="${m.name}" />
            <span class="team-thumb-tint"></span>
            <span class="team-thumb-grad"></span>
            <span class="team-thumb-meta">
              <strong>${m.name.split(' ')[0]}</strong>
              <small>${m.role}</small>
            </span>
          </button>
        `
        )
        .join('');
      thumbsMount.querySelectorAll('.team-thumb-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          renderActiveSlide(Number(btn.getAttribute('data-index')));
        });
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => renderActiveSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => renderActiveSlide(currentIndex + 1));

    renderActiveSlide(0);

    if (dirMount) {
      dirMount.innerHTML = members
        .map(
          (m, idx) => `
          <div class="team-directory-row" data-member-index="${idx}" role="button" tabindex="0" title="Seleziona nello slider">
            <span class="team-dir-num">${m.number}</span>
            <strong class="team-dir-name">${m.name}</strong>
            <span class="team-dir-role">${m.role}</span>
            <span class="team-dir-spec">${m.specialty}</span>
            <span class="team-dir-since">${m.since}</span>
          </div>
        `
        )
        .join('');

      dirMount.querySelectorAll('.team-directory-row').forEach((row) => {
        row.addEventListener('click', () => {
          const i = Number(row.getAttribute('data-member-index'));
          renderActiveSlide(i);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }
  } catch (err) {
    console.error('Error initializing Team page:', err);
  }
}

/**
 * Initializes the Contact Form (`contatti.html`), pre-selecting any `?service=...` query param
 * and submitting the payload to `POST /api/contacts`.
 */
function initContactPage() {
  const form = document.getElementById('main-contact-form');
  const feedback = document.getElementById('contact-form-feedback');
  const submitBtn = document.getElementById('contact-submit-btn');
  const projectSelect = document.getElementById('contact-project-type');

  const params = new URLSearchParams(window.location.search);
  const preselectedService = params.get('service');
  if (preselectedService && projectSelect) {
    const options = Array.from(projectSelect.options);
    const match = options.find((o) =>
      o.value.toLowerCase().includes(preselectedService.toLowerCase())
    );
    if (match) projectSelect.value = match.value;
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (feedback) {
      feedback.className = 'form-feedback';
      feedback.textContent = '';
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'INVIO IN CORSO...';
    }

    const payload = {
      name: document.getElementById('contact-name').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      projectType: document.getElementById('contact-project-type').value,
      budget: document.getElementById('contact-budget').value,
      message: document.getElementById('contact-message').value.trim(),
    };

    try {
      const saved = await window.EvigApi.submitContact(payload);
      if (feedback) {
        feedback.className = 'form-feedback success';
        feedback.textContent = `Messaggio inviato con successo (ID: ${saved.id})! Ti risponderemo entro 24 ore lavorative.`;
      }
      form.reset();
    } catch (err) {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = err.message || 'Errore durante l’invio del messaggio.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'INVIA IL MESSAGGIO';
      }
    }
  });
}

window.EvigPages = {
  initHomepage,
  initServiziPage,
  initPortfolioPage,
  initTeamPage,
  initContactPage,
};
