/**
 * Test-Versand der Express-Matching-Mails — eine Muster-Mail je Gewerk.
 *
 * Zwei Modi:
 *   Vorschau (kein Key nötig):
 *     npx tsx scripts/test-send-emails.ts --preview
 *     → schreibt je Gewerk eine HTML-Datei nach ./email-previews/ zum Anschauen.
 *
 *   Versand an info@bundwimmobilien.de (echter Test über Resend):
 *     RESEND_API_KEY=... npx tsx scripts/test-send-emails.ts
 *     Optional:
 *       TEST_TO=info@bundwimmobilien.de   (Ziel überschreiben)
 *       RESEND_FROM_EMAIL="HausMatch <noreply@haus-match.de>"
 *       ONLY=makler,anwalt                (nur bestimmte Gewerke)
 *
 * Hinweis Resend-Sandbox: Mit der Test-Absenderadresse onboarding@resend.dev
 * kann Resend nur an die eigene Konto-E-Mail senden. Für den Versand an
 * info@bundwimmobilien.de muss die Domain haus-match.de (oder bundwimmobilien.de)
 * in Resend verifiziert und RESEND_FROM_EMAIL entsprechend gesetzt sein.
 */
import { resolveGewerk, ownerHtml, managerHtml } from '../api/_emailTemplates';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ALL_GEWERKE = [
  'hausverwaltung', 'makler', 'anwalt', 'architekt',
  'gutachter', 'handwerker', 'energieberater', 'versicherungsmakler', 'sonstige_profi',
];

const TEST_TO = process.env.TEST_TO || 'info@bundwimmobilien.de';
const FROM = process.env.RESEND_FROM_EMAIL || 'HausMatch <onboarding@resend.dev>';
const CITY = 'Gladbeck';
const APP_URL = (process.env.APP_URL || 'https://haus-match.de').replace(/\/$/, '');

const only = (process.env.ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
const gewerke = only.length > 0 ? ALL_GEWERKE.filter(g => only.includes(g)) : ALL_GEWERKE;

// Muster-Daten, damit jede Vorlage realistisch gefüllt ist.
const sampleCompanies = [
  { name: 'Muster GmbH', address: 'Goethestraße 42, 45964 Gladbeck', phone: '+49 2043 123456' },
  { name: 'Beispiel & Partner', address: 'Marktplatz 1, 45964 Gladbeck' },
];

function ownerMail(gKey: string) {
  const g = resolveGewerk(gKey);
  return {
    subject: `[TEST ${g.labelSing} · Eigentümer-Mail] Ihre Angebotsanfrage in ${CITY} – HausMatch`,
    html: ownerHtml(g, 'Max Mustermann', TEST_TO, CITY, sampleCompanies),
  };
}

function managerMail(gKey: string) {
  const g = resolveGewerk(gKey);
  const ctaUrl = `${APP_URL}/#/login`;
  return {
    subject: `[TEST ${g.labelSing} · Profi-Mail] Neue Anfrage in ${CITY} – im Lead Center ansehen`,
    html: managerHtml(g, CITY, '12 Einheiten', 'WEG', ctaUrl, 'Im Lead Center ansehen →', true),
  };
}

async function sendViaResend(apiKey: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({ from: FROM, to: [TEST_TO], subject, html }),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { /* ignore */ }
    throw new Error(`Resend ${res.status} ${detail}`);
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const preview = process.argv.includes('--preview');

  if (preview) {
    const dir = join(process.cwd(), 'email-previews');
    mkdirSync(dir, { recursive: true });
    for (const g of gewerke) {
      writeFileSync(join(dir, `${g}-eigentuemer.html`), ownerMail(g).html);
      writeFileSync(join(dir, `${g}-profi.html`), managerMail(g).html);
    }
    console.log(`Vorschau geschrieben nach ${dir} (${gewerke.length} Gewerke × 2 Mails).`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY fehlt. Für Vorschau ohne Versand: --preview verwenden.');
    process.exit(1);
  }

  console.log(`Sende Testmails an ${TEST_TO} (Absender: ${FROM}) …\n`);
  let ok = 0, fail = 0;
  for (const g of gewerke) {
    for (const build of [ownerMail, managerMail]) {
      const { subject, html } = build(g);
      try {
        await sendViaResend(apiKey, subject, html);
        console.log(`  ✓ ${subject}`);
        ok++;
      } catch (err: any) {
        console.error(`  ✗ ${subject}\n    ${err.message}`);
        fail++;
      }
      await sleep(600); // Resend-Rate-Limit schonen
    }
  }
  console.log(`\nFertig: ${ok} gesendet, ${fail} fehlgeschlagen.`);
  if (fail > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
