import { createHmac, timingSafeEqual } from 'crypto';

// Signatur für E-Mail-Adressen aus der Live-Suche (/api/search).
//
// Hintergrund (Sicherheitsbericht 23.10.2026, H-09): /api/send-inquiry nahm
// die Empfängerliste `companies[].email` ungeprüft aus dem Request. Damit
// konnte jeder ohne Anmeldung Mails mit HausMatch-Absender an beliebige
// Adressen auslösen. Jetzt gibt /api/search zu jeder gefundenen Adresse ein
// Token mit, das nur der Server erzeugen kann; send-inquiry schreibt nur noch
// Adressen an, die entweder zu einem registrierten Nutzer gehören oder ein
// gültiges Token tragen.
//
// Das Token hängt am Tag (UTC). Gültig sind heute und gestern, damit eine
// Suche kurz vor Mitternacht noch abgeschickt werden kann; danach verfällt es.
// Geheimnis: INQUIRY_SIGNING_SECRET (Vercel → Environment Variables), mindestens
// 32 Zeichen, z. B. `openssl rand -hex 32`.

function secret(): string | null {
  const s = process.env.INQUIRY_SIGNING_SECRET || '';
  return s.length >= 32 ? s : null;
}

export function inquiryTokenConfigured(): boolean {
  return secret() !== null;
}

function dayKey(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

export function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function sign(email: string, day: string, key: string): string {
  return createHmac('sha256', key).update(`${day}|${email}`).digest('hex');
}

/** Token für eine Adresse aus der Suche; null, wenn kein Geheimnis gesetzt ist. */
export function signCompanyEmail(email: unknown): string | null {
  const key = secret();
  const e = normalizeEmail(email);
  if (!key || !e) return null;
  return sign(e, dayKey(0), key);
}

/** Stimmt das Token für diese Adresse (heute oder gestern ausgestellt)? */
export function verifyCompanyEmail(email: unknown, token: unknown): boolean {
  const key = secret();
  const e = normalizeEmail(email);
  if (!key || !e || typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return false;
  const given = Buffer.from(token, 'hex');
  for (const offset of [0, 1]) {
    const expected = Buffer.from(sign(e, dayKey(offset), key), 'hex');
    if (expected.length === given.length && timingSafeEqual(expected, given)) return true;
  }
  return false;
}
