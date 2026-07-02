import type { VercelRequest, VercelResponse } from '@vercel/node';

// Nur die eigene Domain darf die API aus fremden Browser-Kontexten aufrufen —
// kein offenes CORS ('*'), damit Dritt-Seiten die Endpunkte nicht als
// Spam-Relay missbrauchen können (DSGVO Art. 32: Datensicherheit).
// Same-Origin-Aufrufe der App selbst benötigen keine CORS-Freigabe.
const ALLOWED_ORIGINS = new Set([
  'https://haus-match.de',
  'https://www.haus-match.de',
  ...(process.env.APP_URL ? [process.env.APP_URL.replace(/\/$/, '')] : []),
]);

export function applyCors(req: VercelRequest, res: VercelResponse): void {
  const origin = String(req.headers.origin || '');
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
