// Erzeugt beim Build statische, crawlbare HTML-Seiten für den Ratgeber
// (/ratgeber.html und /ratgeber/<slug>.html) sowie die sitemap.xml.
//
// Hintergrund: Die App nutzt Hash-Routing (/#/ratgeber). Suchmaschinen und
// Seobility werten alle /#/...-Links als Startseite, die Ratgeber-Inhalte waren
// daher nicht eigenständig auffindbar und jede Seite hatte zu wenige interne Links.
import type { Plugin } from 'vite';
import { articles, categories, type RatgeberArticle } from '../data/ratgeberArticles';

const SITE = 'https://www.haus-match.de';

/** Statische Seiten aus public/, die zusätzlich in die Sitemap gehören. */
const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/hausverwaltung-wechseln.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/weg-verwaltung.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/wegportal24.html', changefreq: 'monthly', priority: '0.7' },
];

export const articlePath = (a: RatgeberArticle) => `/ratgeber/${a.slug}.html`;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inline-Markdown (**fett**) nach dem Escapen in <strong> umwandeln. */
const inline = (s: string) => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

/** Wandelt das einfache Markdown der Artikel (Überschriften, Listen, Absätze) in HTML um. */
export function contentToHtml(content: string): string {
  const out: string[] = [];
  let list: 'ul' | 'ol' | 'check' | null = null;
  const closeList = () => {
    if (list) out.push(list === 'ol' ? '</ol>' : '</ul>');
    list = null;
  };
  const openList = (type: 'ul' | 'ol' | 'check') => {
    if (list === type) return;
    closeList();
    out.push(type === 'ol' ? '<ol>' : type === 'check' ? '<ul class="checklist">' : '<ul>');
    list = type;
  };

  for (const raw of content.trim().split('\n')) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    const heading = line.match(/^\*\*([^*]+)\*\*$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (heading) {
      closeList();
      out.push(`<h2>${escapeHtml(heading[1])}</h2>`);
    } else if (line.startsWith('- ')) {
      openList('ul');
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line.startsWith('☐ ')) {
      openList('check');
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (numbered) {
      openList('ol');
      out.push(`<li>${inline(numbered[1])}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n      ');
}

const STYLE = `
    body { background:#f1f5f9; font-family:'Inter',system-ui,sans-serif; color:#0f172a; margin:0; }
    main { max-width:880px; margin:0 auto; padding:48px 24px 64px; }
    h1 { font-size:28px; font-weight:800; letter-spacing:-.02em; margin:0 0 12px; }
    h2 { font-size:18px; font-weight:700; margin:28px 0 8px; color:#1e293b; }
    h3 { font-size:16px; font-weight:700; margin:18px 0 4px; }
    p, li { font-size:15px; line-height:1.7; color:#475569; }
    p { margin:0 0 12px; }
    ul, ol { margin:0 0 12px; padding-left:22px; }
    ul.checklist { list-style:none; padding-left:0; }
    ul.checklist li::before { content:'☐ '; }
    a { color:#2563eb; font-weight:600; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .meta { font-size:13px; color:#64748b; }
    .crumbs { font-size:13px; margin-bottom:20px; color:#64748b; }
    .lead { font-size:17px; color:#334155; }
    .box { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:4px 20px 8px; margin-top:32px; }
    nav.site a { margin-right:16px; display:inline-block; }
    header { border-bottom:1px solid #e2e8f0; padding:16px 24px; }
    header a { color:#0f172a; font-weight:800; }`;

function layout(opts: {
  path: string;
  title: string;
  description: string;
  ogType: 'article' | 'website';
  jsonLd: object[];
  body: string;
}): string {
  const url = SITE + opts.path;
  const ld = opts.jsonLd
    .map(o => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <title>${escapeHtml(opts.title)} | HausMatch</title>
  <meta name="description" content="${escapeHtml(opts.description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="${opts.ogType}" />
  <meta property="og:site_name" content="HausMatch" />
  <meta property="og:locale" content="de_DE" />
  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-eddy.png" />
${ld}
  <style>${STYLE}
  </style>
</head>
<body>
  <header><a href="/">HausMatch</a></header>
  <main>
${opts.body}
    <nav class="site" aria-label="Weitere Seiten">
      <a href="/">Startseite</a>
      <a href="/ratgeber.html">Ratgeber</a>
      <a href="/weg-verwaltung.html">WEG-Verwaltung</a>
      <a href="/hausverwaltung-wechseln.html">Hausverwaltung wechseln</a>
      <a href="/wegportal24.html">WEG-Selbstverwaltung</a>
    </nav>
  </main>
</body>
</html>
`;
}

const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: SITE + it.path,
  })),
});

function articlePage(a: RatgeberArticle): string {
  const others = articles.filter(o => o.id !== a.id);
  const body = `    <div class="crumbs"><a href="/">Startseite</a> › <a href="/ratgeber.html">Ratgeber</a> › ${escapeHtml(a.navLabel)}</div>
    <article>
      <p class="meta">${escapeHtml(a.category)} · ${escapeHtml(a.readTime)} Lesezeit</p>
      <h1>${escapeHtml(a.title)}</h1>
      <p class="lead">${escapeHtml(a.intro)} ${escapeHtml(a.summary)}</p>
      ${contentToHtml(a.content)}
      <h2>Häufige Fragen: ${escapeHtml(a.navLabel)}</h2>
${a.faq.map(f => `      <h3>${escapeHtml(f.q)}</h3>
      <p>${escapeHtml(f.a)}</p>`).join('\n')}
    </article>
    <div class="box">
      <h2>Passende Hausverwaltung gesucht?</h2>
      <p>
        Über die <a href="/#/vermittlung">kostenlose Vermittlung von HausMatch</a> erhalten Sie
        unverbindliche Angebote geprüfter Verwaltungen aus Ihrer Region. Sie beschreiben Ihr
        Objekt einmal, vergleichen die Angebote in Ruhe und entscheiden selbst, mit wem Sie
        zusammenarbeiten.
      </p>
    </div>
    <h2>Weitere Artikel im Ratgeber</h2>
    <ul>
${others.map(o => `      <li><a href="${articlePath(o)}">${escapeHtml(o.navLabel)}</a></li>`).join('\n')}
    </ul>`;
  return layout({
    path: articlePath(a),
    title: a.seoTitle,
    description: a.metaDescription,
    ogType: 'article',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title,
        description: a.metaDescription,
        inLanguage: 'de-DE',
        articleSection: a.category,
        mainEntityOfPage: SITE + articlePath(a),
        image: `${SITE}/og-eddy.png`,
        author: { '@type': 'Organization', name: 'HausMatch', url: `${SITE}/` },
        publisher: { '@type': 'Organization', name: 'HausMatch', url: `${SITE}/` },
      },
      breadcrumbLd([
        { name: 'Startseite', path: '/' },
        { name: 'Ratgeber', path: '/ratgeber.html' },
        { name: a.navLabel, path: articlePath(a) },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: a.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
    body,
  });
}

function indexPage(): string {
  const sections = categories
    .filter(c => c !== 'Alle')
    .map(cat => {
      const items = articles.filter(a => a.category === cat);
      if (!items.length) return '';
      return `    <h2>${escapeHtml(cat)}</h2>
${items
  .map(
    a => `    <h3><a href="${articlePath(a)}">${escapeHtml(a.title)}</a></h3>
    <p>${escapeHtml(a.summary)}</p>`,
  )
  .join('\n')}`;
    })
    .filter(Boolean)
    .join('\n');
  const body = `    <div class="crumbs"><a href="/">Startseite</a> › Ratgeber</div>
    <h1>Immobilien-Ratgeber für Eigentümer und Vermieter</h1>
    <p class="lead">
      Praxisnahe Guides für Eigentümer, Vermieter und Käufer: Im Immobilien-Ratgeber von HausMatch
      finden Sie fundiertes Wissen zu Kauf und Finanzierung, WEG und Recht, Verwaltung, Investment,
      Mietrecht sowie energetischer Sanierung. Verständlich erklärt und kostenlos.
    </p>
    <h2>Für wen ist der Ratgeber gedacht?</h2>
    <p>
      Die Artikel richten sich an alle, die mit Immobilien zu tun haben, ohne selbst Profi zu sein:
      Käufer, die ihre erste Wohnung finanzieren, Wohnungseigentümer, die sich in Eigentümerversammlung
      und WEG-Recht zurechtfinden wollen, und private Vermieter, die Mieterhöhung,
      Nebenkostenabrechnung und Steuern rechtssicher erledigen möchten. Auch Verwaltungsbeiräte finden
      hier kompakte Antworten auf typische Fragen aus dem Alltag einer Gemeinschaft.
    </p>
    <h2>So sind die Artikel aufgebaut</h2>
    <p>
      Jeder Beitrag erklärt zunächst die Grundlagen, geht dann Schritt für Schritt durch die wichtigsten
      Regeln, Fristen und Zahlen und endet mit konkreten Tipps sowie häufigen Fragen aus der Praxis.
      Beispielrechnungen zeigen, wie sich Eigenkapital, Rendite oder Steuern im Einzelfall auswirken.
      Gesetzliche Regelungen und Förderprogramme ändern sich regelmäßig, deshalb überarbeiten wir die
      Inhalte laufend. Für rechtliche und steuerliche Einzelfälle ersetzt der Ratgeber keine
      persönliche Beratung durch Anwalt, Steuerberater oder Energieberater.
    </p>
    <h2>Die häufigsten Fragen aus der Praxis</h2>
    <p>
      Viele Anfragen, die uns erreichen, drehen sich um dieselben Themen: Wie viel Eigenkapital ist für
      den Kauf einer Wohnung realistisch, und welche Kaufnebenkosten fallen an? Was hat sich durch die
      WEG-Reform für Eigentümer und Verwalter geändert? Wann ist eine Mieterhöhung zulässig, und wie
      muss sie begründet werden? Welche Fristen gelten für die Nebenkostenabrechnung? Und welche
      Förderung gibt es für eine neue Heizung oder die Dämmung des Hauses? Zu jeder dieser Fragen
      finden Sie unten einen ausführlichen Beitrag. Wenn Sie anschließend Unterstützung im Alltag
      suchen, etwa weil Ihre Gemeinschaft eine neue Verwaltung braucht, hilft Ihnen HausMatch bei der
      Suche nach passenden Ansprechpartnern in Ihrer Region.
    </p>
${sections}
    <div class="box">
      <h2>Verwaltung für Ihre Immobilie finden</h2>
      <p>
        Sie suchen eine neue Verwaltung für Ihre Eigentümergemeinschaft oder Ihr Mietshaus? Über die
        <a href="/#/vermittlung">kostenlose Vermittlung von HausMatch</a> vergleichen Sie Angebote
        geprüfter Verwaltungen aus Ihrer Region. Die Anfrage ist für Eigentümer kostenlos und
        unverbindlich: Sie geben Lage, Anzahl der Einheiten und Ihre Wünsche an, erhalten passende
        Angebote und entscheiden danach in Ruhe, welche Verwaltung am besten zu Ihrer Immobilie passt.
      </p>
    </div>`;
  return layout({
    path: '/ratgeber.html',
    title: 'Immobilien-Ratgeber für Eigentümer',
    description:
      'Immobilien-Ratgeber für Eigentümer und Vermieter: Kauf, Finanzierung, WEG-Recht, Verwaltung, Mietrecht, Steuern und Sanierung.',
    ogType: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Immobilien-Ratgeber für Eigentümer und Vermieter',
        url: `${SITE}/ratgeber.html`,
        inLanguage: 'de-DE',
        hasPart: articles.map(a => ({ '@type': 'Article', headline: a.title, url: SITE + articlePath(a) })),
      },
      breadcrumbLd([
        { name: 'Startseite', path: '/' },
        { name: 'Ratgeber', path: '/ratgeber.html' },
      ]),
    ],
    body,
  });
}

function sitemap(): string {
  const entries = [
    ...STATIC_PAGES,
    { path: '/ratgeber.html', changefreq: 'weekly', priority: '0.8' },
    ...articles.map(a => ({ path: articlePath(a), changefreq: 'monthly', priority: '0.7' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    e => `  <url>
    <loc>${SITE}${e.path}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
}

/** Alle generierten Dateien: Pfad (ohne führenden Slash) → Inhalt. */
export function ratgeberFiles(): Record<string, string> {
  const files: Record<string, string> = {
    'ratgeber.html': indexPage(),
    'sitemap.xml': sitemap(),
  };
  for (const a of articles) files[articlePath(a).slice(1)] = articlePage(a);
  return files;
}

/** Vite-Plugin: schreibt die Seiten beim Build nach dist/ und liefert sie im Dev-Server aus. */
export function ratgeberPagesPlugin(): Plugin {
  return {
    name: 'hausmatch-ratgeber-pages',
    generateBundle() {
      for (const [fileName, source] of Object.entries(ratgeberFiles())) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = ratgeberFiles()[(req.url || '').split('?')[0].slice(1)];
        if (!file) return next();
        res.setHeader('Content-Type', req.url!.endsWith('.xml') ? 'application/xml' : 'text/html; charset=utf-8');
        res.end(file);
      });
    },
  };
}
