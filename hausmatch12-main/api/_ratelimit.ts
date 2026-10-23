import type { VercelRequest } from '@vercel/node';

// Zähler für Rate-Limits der Vercel-Funktionen.
//
// Mit KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV / Upstash Redis, REST)
// gelten die Grenzen instanzübergreifend und überleben Neustarts. Ohne diese
// Variablen zählt jede Funktionsinstanz für sich im Arbeitsspeicher — besser
// als nichts, aber nur „ungefähr“. Dieselbe Bauweise wie api/_store.js auf
// bundwimmobilien.de. Fehler im Speicher blockieren nie die Anwendung.

const memory = new Map<string, { value: number; expiresAt: number }>();

function restConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(process.env.KV_REST_API_URL as string, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (!res.ok || data.error) throw new Error('KV-Fehler: ' + (data.error || res.status));
  return data.result;
}

function memoryIncrement(key: string, ttlSeconds: number): number {
  const now = Date.now();
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.expiresAt <= now) memory.delete(k);
  }
  const entry = memory.get(key);
  if (!entry || entry.expiresAt <= now) {
    memory.set(key, { value: 1, expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }
  entry.value += 1;
  return entry.value;
}

async function incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
  if (restConfigured()) {
    const count = Number(await redis(['INCR', key]));
    if (count === 1) await redis(['EXPIRE', key, String(ttlSeconds)]);
    return count;
  }
  return memoryIncrement(key, ttlSeconds);
}

/**
 * Zählt einen Versuch und meldet, ob er noch im Limit liegt.
 * `bucket` benennt die Grenze (z. B. "inquiry_ip"), `key` den Zähler (IP, Adresse, Tag).
 */
export async function allowRequest(bucket: string, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const count = await incrementWithTtl(`rl:${bucket}:${key}`, windowSeconds);
    return count <= limit;
  } catch (e) {
    console.error('Rate-Limit-Speicher nicht erreichbar:', e instanceof Error ? e.message : e);
    return true;
  }
}

/** Client-IP. Auf Vercel setzt die Plattform x-forwarded-for selbst (erster Eintrag = Client). */
export function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) return real.trim();
  return req.socket?.remoteAddress || '0.0.0.0';
}

/** Heutiges Datum (UTC) als Schlüssel für Tageskontingente. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
