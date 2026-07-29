/**
 * Screenshots der HausMatch-Website — z. B. als Vorlagen-Material für Werbevideos.
 *
 * Aufnahme in drei Sets:
 *   desktop-16x9/  1920x1080 @2x  (3840x2160) — Schnittformat für YouTube/Web
 *   mobile-9x16/    540x960  @2x  (1080x1920) — Reels/Shorts/TikTok
 *   highlights/     einzelne Zustände mit Interaktion (Suche gefüllt, Tabs, Menü)
 *
 * Je Seite entsteht ein Viewport-Bild und ein "-fullpage"-Bild; das Fullpage-Bild
 * eignet sich für Scroll-/Pan-Fahrten im Schnittprogramm.
 *
 * Voraussetzungen:
 *   1. Dev-Server läuft:  npm run dev            (http://localhost:5173)
 *   2. Playwright liegt vor: npx playwright install chromium
 *   3. .env.local mit Firebase-Werten — sonst startet die App nicht.
 *
 * Aufruf:  node scripts/screenshots.mjs [zielordner]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173';
const OUT = process.argv[2] || 'screenshots';

// Die App nutzt HashRouter — Routen liegen unter /#/...
const pages = [
  ['01-startseite', '/#/'],
  ['02-fuer-suchende', '/#/seekers'],
  ['03-fuer-verwalter', '/#/managers'],
  ['04-vermittlung', '/#/vermittlung'],
  ['05-marktplatz', '/#/marktplatz'],
  ['06-ki-berater', '/#/ki-berater'],
  ['07-kreditrechner', '/#/kreditrechner'],
  ['08-ratgeber', '/#/ratgeber'],
  ['09-netzwerk', '/#/network'],
  ['10-registrieren', '/#/register'],
  ['11-ueber-uns', '/#/about'],
  ['12-kontakt', '/#/contact'],
];

const formats = [
  { name: 'desktop-16x9', width: 1920, height: 1080, dsf: 2, mobile: false },
  { name: 'mobile-9x16', width: 540, height: 960, dsf: 2, mobile: true },
];

const problems = [];

async function newContext(browser, fmt) {
  const ctx = await browser.newContext({
    viewport: { width: fmt.width, height: fmt.height },
    deviceScaleFactor: fmt.dsf,
    isMobile: fmt.mobile,
    hasTouch: fmt.mobile,
    locale: 'de-DE',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  // Client-Code liest process.env (geminiService); im Browser gibt es kein
  // process — für die Aufnahme genügt ein leerer Stub.
  await ctx.addInitScript(() => {
    window.process = { env: {} };
  });
  return ctx;
}

async function open(page, route) {
  // Ein reiner Hash-Wechsel löst keinen Load aus — vorher leeren und neu laden.
  await page.goto('about:blank');
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  for (const label of ['Alle akzeptieren', 'Akzeptieren', 'Verstanden', 'OK']) {
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(400);
      break;
    }
  }
}

async function shootPages(browser, fmt) {
  const dir = path.join(OUT, fmt.name);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await newContext(browser, fmt);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${fmt.name} ${page.url()}: ${e.message}`));

  for (const [name, route] of pages) {
    await open(page, route);
    await page.screenshot({ path: path.join(dir, `${name}.png`) });
    await page.screenshot({ path: path.join(dir, `${name}-fullpage.png`), fullPage: true });
    console.log(`${fmt.name}: ${name} (${route})`);
  }
  await ctx.close();
}

/** Einzelne Zustände mit Interaktion — lebendiger als reine Ansichten. */
async function shootHighlights(browser) {
  const dir = path.join(OUT, 'highlights');
  fs.mkdirSync(dir, { recursive: true });

  const desktop = formats[0];
  const mobile = formats[1];

  const shots = [
    {
      file: 'h1-startseite-suche-gefuellt',
      fmt: desktop,
      route: '/#/',
      async act(page) {
        const input = page.getByPlaceholder(/In welcher Stadt/i).first();
        await input.fill('München');
        await page.waitForTimeout(300);
      },
    },
    {
      file: 'h2-startseite-rolle-makler',
      fmt: desktop,
      route: '/#/',
      async act(page) {
        await page.getByRole('button', { name: /^Immobilienmakler$/i }).first().click();
        await page.waitForTimeout(400);
      },
    },
    {
      file: 'h3-vermittlung-suche-gefuellt',
      fmt: desktop,
      route: '/#/vermittlung',
      async act(page) {
        const input = page.getByPlaceholder(/Hausverwaltung München/i).first();
        await input.fill('Hausverwaltung München');
        await page.waitForTimeout(300);
      },
    },
    {
      file: 'h4-kreditrechner-rendite',
      fmt: desktop,
      route: '/#/kreditrechner',
      async act(page) {
        await page.getByRole('button', { name: /^Rendite$/i }).first().click();
        await page.waitForTimeout(600);
      },
    },
    {
      file: 'h5-kreditrechner-tilgungsplan',
      fmt: desktop,
      route: '/#/kreditrechner',
      async act(page) {
        await page.getByRole('button', { name: /^Tilgungsplan$/i }).first().click();
        await page.waitForTimeout(600);
      },
    },
    {
      file: 'h6-marktplatz-filter-auftrag',
      fmt: desktop,
      route: '/#/marktplatz',
      async act(page) {
        await page.getByRole('button', { name: /^Auftrag$/i }).first().click();
        await page.waitForTimeout(500);
      },
    },
    {
      file: 'h7-mobil-menue-offen',
      fmt: mobile,
      route: '/#/',
      async act(page) {
        await page.getByLabel('Menü öffnen').first().click();
        await page.waitForTimeout(600);
      },
    },
  ];

  for (const shot of shots) {
    const ctx = await newContext(browser, shot.fmt);
    const page = await ctx.newPage();
    try {
      await open(page, shot.route);
      await shot.act(page);
      await page.screenshot({ path: path.join(dir, `${shot.file}.png`) });
      console.log(`highlights: ${shot.file}`);
    } catch (e) {
      problems.push(`highlight ${shot.file}: ${e.message.split('\n')[0]}`);
      console.log(`highlights: ${shot.file} — ÜBERSPRUNGEN (${e.message.split('\n')[0]})`);
    }
    await ctx.close();
  }
}

// PLAYWRIGHT_CHROMIUM_PATH erlaubt ein bereits vorhandenes Chromium statt des
// von Playwright heruntergeladenen Builds.
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
for (const fmt of formats) await shootPages(browser, fmt);
await shootHighlights(browser);
await browser.close();

if (problems.length) {
  console.log('\n--- Hinweise ---');
  console.log([...new Set(problems)].join('\n'));
}
