// ─── Gemeinsame E-Mail-Vorlagen (Express-Matching) ──────────────────────────
// Von api/send-inquiry.ts und vom Test-Skript (scripts/test-send-emails.ts)
// genutzt. Reine String-Funktionen ohne Framework-Abhängigkeiten.

export interface GewerkInfo {
  key: string;
  /** Einzahl, z. B. "Hausverwaltung" */
  labelSing: string;
  /** Mehrzahl, z. B. "Hausverwaltungen" */
  labelPlural: string;
  /** Akkusativ mit unbestimmtem Artikel: "eine Hausverwaltung" / "einen Rechtsanwalt" */
  akk: string;
  /** Fußzeile Eigentümer-Mail */
  ownerPartner: string;
  /** Fußzeile Profi-Mail */
  platformRole: string;
  /** Objektart-Zeile nur dort zeigen, wo sie sinnvoll ist (WEG-Verwaltung). */
  showObjektart: boolean;
}

// Schlüssel entsprechen den UserType-Werten aus types.ts.
const GEWERKE: Record<string, GewerkInfo> = {
  hausverwaltung: {
    key: 'hausverwaltung',
    labelSing: 'Hausverwaltung', labelPlural: 'Hausverwaltungen', akk: 'eine Hausverwaltung',
    ownerPartner: 'Ihr Partner für die perfekte Hausverwaltung',
    platformRole: 'Die Plattform für professionelle Hausverwaltungen',
    showObjektart: true,
  },
  makler: {
    key: 'makler',
    labelSing: 'Immobilienmakler', labelPlural: 'Immobilienmakler', akk: 'einen Immobilienmakler',
    ownerPartner: 'Ihr Partner für die passende Vermittlung',
    platformRole: 'Die Plattform für Immobilienmakler',
    showObjektart: false,
  },
  anwalt: {
    key: 'anwalt',
    labelSing: 'Rechtsanwalt', labelPlural: 'Rechtsanwälte', akk: 'einen Rechtsanwalt',
    ownerPartner: 'Ihr Partner für rechtliche Fragen rund um Immobilien',
    platformRole: 'Die Plattform für Anwälte im Immobilienrecht',
    showObjektart: false,
  },
  architekt: {
    key: 'architekt',
    labelSing: 'Architekt', labelPlural: 'Architekten', akk: 'einen Architekten',
    ownerPartner: 'Ihr Partner für Planung und Bauleitung',
    platformRole: 'Die Plattform für Architekten und Planer',
    showObjektart: false,
  },
  gutachter: {
    key: 'gutachter',
    labelSing: 'Gutachter', labelPlural: 'Gutachter', akk: 'einen Gutachter',
    ownerPartner: 'Ihr Partner für Immobilienbewertung',
    platformRole: 'Die Plattform für Immobiliengutachter',
    showObjektart: false,
  },
  handwerker: {
    key: 'handwerker',
    labelSing: 'Handwerker', labelPlural: 'Handwerker', akk: 'einen Handwerker',
    ownerPartner: 'Ihr Partner für Instandhaltung und Facility',
    platformRole: 'Die Plattform für Handwerks- und Facility-Betriebe',
    showObjektart: false,
  },
  energieberater: {
    key: 'energieberater',
    labelSing: 'Energieberater', labelPlural: 'Energieberater', akk: 'einen Energieberater',
    ownerPartner: 'Ihr Partner für energetische Sanierung',
    platformRole: 'Die Plattform für Energieberater',
    showObjektart: false,
  },
  sonstige_profi: {
    key: 'sonstige_profi',
    labelSing: 'Dienstleister', labelPlural: 'Dienstleister', akk: 'einen Dienstleister',
    ownerPartner: 'Ihr Partner rund um die Immobilie',
    platformRole: 'Die Plattform für Immobilienprofis',
    showObjektart: false,
  },
};

/** Liefert die Gewerk-Infos zu einem serviceType; Fallback ist Hausverwaltung. */
export function resolveGewerk(serviceType?: string): GewerkInfo {
  const key = (serviceType || '').toLowerCase().trim();
  return GEWERKE[key] || GEWERKE.hausverwaltung;
}

export const css = `
  body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07)}
  .hdr{background:#2563eb;padding:36px 48px}
  .logo{font-size:22px;font-weight:900;color:#fff;letter-spacing:-.5px}
  .logo span{color:#bfdbfe}
  .body{padding:48px}
  .badge{display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;margin-bottom:20px}
  h1{font-size:24px;font-weight:800;color:#0f172a;margin:0 0 12px}
  .intro{font-size:15px;color:#475569;line-height:1.7;margin:0 0 32px}
  .lbl{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin:0 0 12px}
  .list{background:#f8fafc;border-radius:16px;padding:8px 24px;margin:0 0 32px}
  .row{padding:12px 0;border-bottom:1px solid #e2e8f0;display:flex;align-items:flex-start;gap:12px}
  .row:last-child{border-bottom:none}
  .dot{width:8px;height:8px;background:#2563eb;border-radius:50%;flex-shrink:0;margin-top:5px}
  .rname{font-weight:700;color:#1e293b;font-size:15px}
  .rmeta{font-size:13px;color:#94a3b8;margin-top:2px}
  .drow{padding:10px 0;border-bottom:1px solid #e2e8f0;display:flex;gap:16px;font-size:14px}
  .drow:last-child{border-bottom:none}
  .dlbl{color:#94a3b8;font-weight:700;width:80px;flex-shrink:0}
  .dval{color:#1e293b;font-weight:600}
  .box{background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 32px}
  .box p{margin:0;font-size:14px;color:#1e40af;line-height:1.6;font-weight:500}
  .cta{display:block;background:#2563eb;color:#fff!important;text-align:center;padding:16px 32px;border-radius:14px;font-weight:900;font-size:15px;text-decoration:none;margin:32px 0}
  .ftr{background:#f8fafc;padding:28px 48px;border-top:1px solid #e2e8f0}
  .fname{font-weight:800;color:#0f172a;font-size:15px;margin:0 0 4px}
  .frole{font-size:13px;color:#64748b;margin:0 0 10px}
  .flinks{font-size:13px;color:#94a3b8}
  .flinks a{color:#2563eb;text-decoration:none;font-weight:600}
`;

// Bestätigungs-Mail an den Eigentümer.
export const ownerHtml = (
  gewerk: GewerkInfo,
  name: string, email: string, city: string,
  companies: { name: string; address?: string; phone?: string }[]
) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="wrap">
  <div class="hdr"><div class="logo">Haus<span>Match</span></div></div>
  <div class="body">
    <span class="badge">Express-Matching</span>
    <h1>Ihre Anfrage ist eingegangen, ${name.split(' ')[0]}!</h1>
    <p class="intro">Wir haben <strong>${companies.length} ${companies.length === 1 ? gewerk.labelSing : gewerk.labelPlural}</strong> in <strong>${city}</strong> diskret um ein Angebot gebeten. Sobald ${companies.length === 1 ? 'dieser' : 'einer'} Ihr Projekt im HausMatch Lead Center annimmt, erhalten Sie das Angebot direkt über HausMatch an <strong>${email}</strong>.</p>
    <p class="lbl">Kontaktierte ${gewerk.labelPlural}</p>
    <div class="list">
      ${companies.map(c => `<div class="row"><div class="dot"></div><div><div class="rname">${c.name}</div>${c.address || c.phone ? `<div class="rmeta">${[c.address, c.phone].filter(Boolean).join(' · ')}</div>` : ''}</div></div>`).join('')}
    </div>
    <div class="box"><p>💡 <strong>Wie geht es weiter?</strong><br>Die ${gewerk.labelPlural} sehen zunächst nur die groben Eckdaten Ihres Anliegens. Erst wenn sie im Lead Center ein Angebot abgeben, werden Ihre Kontaktdaten benötigt. So bleiben Sie geschützt.</p></div>
  </div>
  <div class="ftr">
    <p class="fname">Ihr HausMatch-Team</p>
    <p class="frole">${gewerk.ownerPartner}</p>
    <p class="flinks"><a href="https://haus-match.de">haus-match.de</a> &nbsp;·&nbsp; <a href="mailto:barth@bundwimmobilien.de">barth@bundwimmobilien.de</a></p>
  </div>
</div></body></html>`;

// Profi-Mail: NUR grobe Daten (Stadt, Einheiten, ggf. Objektart) + Link ins Lead Center.
// Keine Eigentümer-Kontaktdaten, kein mailto. Der CTA unterscheidet registriert/eingeladen.
export const managerHtml = (
  gewerk: GewerkInfo,
  city: string, einheiten: string, propertyType: string,
  ctaUrl: string, ctaLabel: string, registered: boolean
) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="wrap">
  <div class="hdr"><div class="logo">Haus<span>Match</span></div></div>
  <div class="body">
    <span class="badge">Neue Angebotsanfrage</span>
    <h1>Ein Eigentümer sucht ${gewerk.akk} in ${city}</h1>
    <p class="intro">Über <strong>HausMatch</strong> ist eine neue Anfrage für Sie eingegangen. Hier die groben Eckdaten. Die vollständigen Details und die Möglichkeit, ein Angebot abzugeben, finden Sie im Lead Center.</p>
    <p class="lbl">Eckdaten der Anfrage</p>
    <div class="list">
      <div class="drow"><span class="dlbl">Region</span><span class="dval">${city}</span></div>
      <div class="drow"><span class="dlbl">Einheiten</span><span class="dval">${einheiten}</span></div>
      ${gewerk.showObjektart ? `<div class="drow"><span class="dlbl">Objektart</span><span class="dval">${propertyType}</span></div>` : ''}
    </div>
    <div class="box"><p>${registered
      ? '🔒 <strong>Diskret & geschützt:</strong> Die Kontaktdaten des Eigentümers sehen Sie erst, wenn Sie im Lead Center ein Angebot abgeben.'
      : '✨ <strong>Sie sind noch nicht registriert.</strong> Registrieren Sie sich kostenlos per Magic-Link. Danach liegt diese Anfrage direkt in Ihrem Lead Center.'}</p></div>
    <a class="cta" href="${ctaUrl}">${ctaLabel}</a>
    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0">Angebote geben Sie ausschließlich über das HausMatch Lead Center ab.</p>
  </div>
  <div class="ftr">
    <p class="fname">HausMatch-Team</p>
    <p class="frole">${gewerk.platformRole}</p>
    <p class="flinks"><a href="https://haus-match.de">haus-match.de</a></p>
  </div>
</div></body></html>`;
