/**
 * @file seedData.js
 * @description Initial seed data extracted from the Figma design specifications of EvigDog Studio.
 * Used to populate MongoDB (or the local fallback store) on first startup so the application
 * is immediately ready for live demonstration without manual database setup.
 */

const seedData = {
  projects: [
    {
      id: 'proj-1',
      title: 'Rebrand Luxe Café',
      tagline: 'Brand Identity · Packaging',
      category: 'Brand Identity',
      year: '2024',
      client: 'Luxe Café Milano',
      duration: '10 Settimane',
      featured: true,
      image: '/assets/images/portfolio-1.jpg',
      description:
        "Ridefinizione completa dell'identità visiva per una storica torrefazione milanese: dal logotipo ai materiali di packaging sostenibile fino all'esperienza in boutique.",
      deliverables: ['Logotipo & Sistema Visivo', 'Packaging Sostenibile', 'Brand Guidelines'],
    },
    {
      id: 'proj-2',
      title: 'Bevanda Mobile App',
      tagline: 'UI/UX Design · Mobile App',
      category: 'UI/UX Design',
      year: '2024',
      client: 'Bevanda S.r.l.',
      duration: '12 Settimane',
      featured: false,
      image: '/assets/images/portfolio-2.jpg',
      description:
        "Esperienza mobile nativa pensata per ordinazioni rapide, programma fedeltà gamificato e tracciamento in tempo reale delle consegne urbane.",
      deliverables: ['User Research', 'Design System Figma', 'Prototipo Interattivo'],
    },
    {
      id: 'proj-3',
      title: 'Architetto Portfolio',
      tagline: 'Web Design · Sviluppo Frontend',
      category: 'Web Design & Dev',
      year: '2023',
      client: 'Studio Vieri Architettura',
      duration: '8 Settimane',
      featured: false,
      image: '/assets/images/portfolio-3.jpg',
      description:
        "Piattaforma editoriale minimalista con transizioni fluide, gallerie ad alta risoluzione e architettura orientata alla performance e all'accessibilità WCAG.",
      deliverables: ['Direzione Artistica', 'Sviluppo Web Custom', 'SEO Tecnico'],
    },
    {
      id: 'proj-4',
      title: 'Moda Italiana Campaign',
      tagline: 'Fotografia & Video · Art Direction',
      category: 'Fotografia & Video',
      year: '2024',
      client: 'Atelier Conti',
      duration: '6 Settimane',
      featured: false,
      image: '/assets/images/portfolio-4.jpg',
      description:
        "Produzione visiva multicanale per il lancio della collezione autunno/inverno: shooting editoriale, fashion film e contenuti social verticali.",
      deliverables: ['Product & Editorial Shooting', 'Video Storytelling', 'Post-produzione'],
    },
    {
      id: 'proj-5',
      title: 'Startup Pitch Deck',
      tagline: 'Brand Identity · Motion & 3D',
      category: 'Brand Identity',
      year: '2023',
      client: 'NexaTech AI',
      duration: '5 Settimane',
      featured: false,
      image: '/assets/images/portfolio-5.jpg',
      description:
        "Identità verbale, visual storytelling e presentazioni animate per il round di finanziamento Seed da 2,4M€ di una startup deep-tech.",
      deliverables: ['Visual Identity', 'Investor Deck', 'Infografiche 3D'],
    },
    {
      id: 'proj-6',
      title: 'FinTrack Dashboard',
      tagline: 'UI/UX Design · Web App',
      category: 'UI/UX Design',
      year: '2024',
      client: 'FinTrack Europe',
      duration: '14 Settimane',
      featured: false,
      image: '/assets/images/portfolio-6.jpg',
      description:
        "Dashboard analitica SaaS per il monitoraggio dei flussi di cassa aziendali con data visualization chiara, dark mode nativa e componenti modulari.",
      deliverables: ['UX Architecture', 'UI Kit & Tokens', 'Usability Testing'],
    },
  ],

  services: [
    {
      id: 'srv-01',
      number: '01',
      shortTitle: 'Brand Identity',
      title: 'Brand Identity',
      description:
        "Costruiamo identità visive coerenti e memorabili — dal logotipo alla brand guideline completa, per posizionare il tuo brand in modo distintivo sul mercato.",
      tags: [
        'Logotipo & varianti',
        'Sistema tipografico',
        'Stationery',
        'Brand Guidelines',
        'Palette cromatica',
      ],
    },
    {
      id: 'srv-02',
      number: '02',
      shortTitle: 'Web Design',
      title: 'Web Design & Dev',
      description:
        "Siti web su misura, performanti e accessibili. Dal wireframe al codice di produzione, progettati per convertire visitatori in clienti reali.",
      tags: [
        'UI Design',
        'Accessibilità WCAG',
        'Sviluppo Frontend',
        'CMS Integration',
        'SEO tecnico',
      ],
    },
    {
      id: 'srv-03',
      number: '03',
      shortTitle: 'UI',
      title: 'UI/UX Design',
      description:
        "Esperienze digitali intuitive e coinvolgenti, costruite attorno ai bisogni reali degli utenti attraverso ricerca, test e design system scalabili.",
      tags: [
        'Test utente',
        'User Research',
        'Wireframing',
        'Prototipi interattivi',
        'Design System',
      ],
    },
    {
      id: 'srv-04',
      number: '04',
      shortTitle: 'Motion&3D',
      title: 'Motion & 3D',
      description:
        "Animazioni, video e render tridimensionali che danno vita ai concetti più complessi e catturano l'attenzione su ogni touchpoint digitale.",
      tags: [
        'Visual Effects',
        'Motion Graphics',
        'Animazioni UI',
        'Render 3D',
        'Video intro',
      ],
    },
    {
      id: 'srv-05',
      number: '05',
      shortTitle: 'Digital Marketing',
      title: 'Digital Marketing',
      description:
        "Strategie di contenuto, SEO e campagne a pagamento guidate dai dati per far crescere la visibilità organica e il ritorno sull'investimento.",
      tags: [
        'SEO & SEM',
        'Analytics & Report',
        'Social Media',
        'Content Strategy',
        'Email Marketing',
      ],
    },
    {
      id: 'srv-06',
      number: '06',
      shortTitle: 'Foto&Video',
      title: 'Fotografia & Video',
      description:
        "Produzione visiva professionale dal concept al master finale: shooting di prodotto, ritratti corporate, riprese drone e storytelling cinematografico.",
      tags: [
        'Post-produzione',
        'Product Shooting',
        'Drone & Aerial',
        'Corporate Portrait',
        'Video Storytelling',
      ],
    },
  ],

  team: [
    {
      id: 'team-01',
      number: '01',
      name: 'Sofia Reale',
      role: 'Creative Director',
      specialty: 'Brand & Identità Visiva',
      since: 'Dal 2017',
      quote: '"Il design è la risposta silenziosa a tutte le domande che il brand non ha ancora fatto."',
      image: '/assets/images/team-2.jpg',
    },
    {
      id: 'team-02',
      number: '02',
      name: 'Marco Torelli',
      role: 'Head of Engineering',
      specialty: 'Architetture Cloud & Web Dev',
      since: 'Dal 2018',
      quote: '"Il codice migliore è quello invisibile: veloce, resiliente e costruito per durare nel tempo."',
      image: '/assets/images/team-3.jpg',
    },
    {
      id: 'team-03',
      number: '03',
      name: 'Elena Vitale',
      role: 'Lead UX/UI Designer',
      specialty: 'Design System & User Research',
      since: 'Dal 2019',
      quote: '"L’empatia con l’utente trasforma un’interfaccia complessa in un gesto naturale."',
      image: '/assets/images/team-4.jpg',
    },
    {
      id: 'team-04',
      number: '04',
      name: 'Davide Mancini',
      role: 'Motion & 3D Artist',
      specialty: '3D Direction & Visual Storytelling',
      since: 'Dal 2020',
      quote: '"Il movimento dà ritmo all’identità: racconta ciò che le parole statiche non possono esprimere."',
      image: '/assets/images/team-5.jpg',
    },
    {
      id: 'team-05',
      number: '05',
      name: 'Luca Ferrari',
      role: 'Digital Strategist',
      specialty: 'Growth, SEO & Performance',
      since: 'Dal 2021',
      quote: '"La creatività senza strategia è arte; la creatività guidata dai dati è crescita misurabile."',
      image: '/assets/images/team-6.jpg',
    },
  ],

  faqs: [
    {
      id: 'faq-1',
      code: '01',
      question: 'Quanto tempo richiede un progetto tipico?',
      answer:
        "La durata dipende dalla complessità: un progetto di Brand Identity o un sito web corporate richiede mediamente dalle 6 alle 10 settimane, mentre piattaforme web custom o ecosistemi completi variano tra le 10 e le 16 settimane. Definiamo sempre una roadmap chiara prima di iniziare.",
    },
    {
      id: 'faq-2',
      code: '02',
      question: 'Come funziona il vostro processo di lavoro?',
      answer:
        "Lavoriamo in 6 fasi strutturate: Ascolto, Strategia, Progettazione in Figma, Sviluppo custom, Lancio controllato e Crescita continua. Ogni settimana condividiamo avanzamenti concreti e raccogliamo feedback puntuali.",
    },
    {
      id: 'faq-3',
      code: '03',
      question: "Lavorate con clienti fuori dall'Italia?",
      answer:
        "Assolutamente sì. Oltre alla nostra sede di Milano collaboriamo regolarmente da remoto con aziende e startup in tutta Europa e negli Stati Uniti, gestendo comunicazione e documentazione sia in italiano che in inglese.",
    },
    {
      id: 'faq-4',
      code: '04',
      question: 'È possibile procedere solo con una parte del progetto?',
      answer:
        "Certamente. Ogni servizio è modulare: possiamo affiancarvi anche solo per il rebranding, per il design UI/UX in Figma oppure per lo sviluppo e il deployment Cloud di un design già esistente.",
    },
  ],

  contacts: [
    {
      id: 'cnt-demo-1',
      name: 'Giulia Bianchi',
      email: 'giulia.bianchi@auroramilano.it',
      projectType: 'Brand Identity & Sito Web',
      budget: '10.000€ – 25.000€',
      message:
        'Buongiorno, stiamo pianificando il rebranding del nostro showroom a Milano e vorremmo fissare una call conoscitiva per il nuovo sito.',
      status: 'nuovo',
      createdAt: '2026-10-28T10:15:00.000Z',
    },
    {
      id: 'cnt-demo-2',
      name: 'Alessandro Conti',
      email: 'a.conti@fintrack.eu',
      projectType: 'UI/UX Design',
      budget: '25.000€+',
      message:
        'Vorremmo estendere il nostro Design System su mobile e riprogettare la dashboard analytics entro il primo trimestre.',
      status: 'in_lavorazione',
      createdAt: '2026-10-25T15:40:00.000Z',
    },
  ],

  newsletter: [
    {
      id: 'nl-demo-1',
      email: 'marco.rossi@startupitalia.it',
      source: 'Footer CTA',
      createdAt: '2026-10-29T09:12:00.000Z',
    },
  ],

  settings: {
    maintenanceMode: false,
    updatedAt: '2026-11-01T08:00:00.000Z',
  },
};

module.exports = seedData;

