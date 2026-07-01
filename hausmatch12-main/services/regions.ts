// Kategorisiert eine frei eingegebene Stadt in eine deutsche Region (Bundesland).
// Wird beim Anlegen/Aktualisieren eines Kontos gesetzt, damit Konten nach Region
// gruppiert und gematcht werden können (z. B. Leads einer Region zuordnen).

export const REGIONS = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
  'Unbekannt',
] as const;

export type Region = typeof REGIONS[number];

// Wichtigste Städte je Bundesland (Schlüssel in Kleinbuchstaben).
const CITY_REGION: Record<string, Region> = {
  // Nordrhein-Westfalen
  'köln': 'Nordrhein-Westfalen', 'düsseldorf': 'Nordrhein-Westfalen', 'dortmund': 'Nordrhein-Westfalen',
  'essen': 'Nordrhein-Westfalen', 'duisburg': 'Nordrhein-Westfalen', 'bochum': 'Nordrhein-Westfalen',
  'wuppertal': 'Nordrhein-Westfalen', 'bielefeld': 'Nordrhein-Westfalen', 'bonn': 'Nordrhein-Westfalen',
  'münster': 'Nordrhein-Westfalen', 'gelsenkirchen': 'Nordrhein-Westfalen', 'mönchengladbach': 'Nordrhein-Westfalen',
  'aachen': 'Nordrhein-Westfalen', 'krefeld': 'Nordrhein-Westfalen', 'oberhausen': 'Nordrhein-Westfalen',
  'hagen': 'Nordrhein-Westfalen', 'hamm': 'Nordrhein-Westfalen', 'gladbeck': 'Nordrhein-Westfalen',
  'recklinghausen': 'Nordrhein-Westfalen', 'leverkusen': 'Nordrhein-Westfalen', 'solingen': 'Nordrhein-Westfalen',
  'bottrop': 'Nordrhein-Westfalen', 'paderborn': 'Nordrhein-Westfalen', 'siegen': 'Nordrhein-Westfalen',
  // Bayern
  'münchen': 'Bayern', 'nürnberg': 'Bayern', 'augsburg': 'Bayern', 'regensburg': 'Bayern',
  'würzburg': 'Bayern', 'ingolstadt': 'Bayern', 'fürth': 'Bayern', 'erlangen': 'Bayern',
  'bamberg': 'Bayern', 'bayreuth': 'Bayern', 'landshut': 'Bayern', 'rosenheim': 'Bayern',
  // Baden-Württemberg
  'stuttgart': 'Baden-Württemberg', 'karlsruhe': 'Baden-Württemberg', 'mannheim': 'Baden-Württemberg',
  'freiburg': 'Baden-Württemberg', 'heidelberg': 'Baden-Württemberg', 'heilbronn': 'Baden-Württemberg',
  'ulm': 'Baden-Württemberg', 'pforzheim': 'Baden-Württemberg', 'reutlingen': 'Baden-Württemberg',
  'esslingen': 'Baden-Württemberg', 'tübingen': 'Baden-Württemberg', 'konstanz': 'Baden-Württemberg',
  // Hessen
  'frankfurt': 'Hessen', 'wiesbaden': 'Hessen', 'kassel': 'Hessen', 'darmstadt': 'Hessen',
  'offenbach': 'Hessen', 'hanau': 'Hessen', 'gießen': 'Hessen', 'marburg': 'Hessen', 'fulda': 'Hessen',
  // Niedersachsen
  'hannover': 'Niedersachsen', 'braunschweig': 'Niedersachsen', 'osnabrück': 'Niedersachsen',
  'oldenburg': 'Niedersachsen', 'wolfsburg': 'Niedersachsen', 'göttingen': 'Niedersachsen',
  'hildesheim': 'Niedersachsen', 'salzgitter': 'Niedersachsen', 'lüneburg': 'Niedersachsen',
  // Stadtstaaten
  'berlin': 'Berlin', 'hamburg': 'Hamburg', 'bremen': 'Bremen', 'bremerhaven': 'Bremen',
  // Sachsen
  'leipzig': 'Sachsen', 'dresden': 'Sachsen', 'chemnitz': 'Sachsen', 'zwickau': 'Sachsen', 'görlitz': 'Sachsen',
  // Rheinland-Pfalz
  'mainz': 'Rheinland-Pfalz', 'ludwigshafen': 'Rheinland-Pfalz', 'koblenz': 'Rheinland-Pfalz',
  'trier': 'Rheinland-Pfalz', 'kaiserslautern': 'Rheinland-Pfalz', 'worms': 'Rheinland-Pfalz',
  // Schleswig-Holstein
  'kiel': 'Schleswig-Holstein', 'lübeck': 'Schleswig-Holstein', 'flensburg': 'Schleswig-Holstein',
  'neumünster': 'Schleswig-Holstein',
  // Brandenburg
  'potsdam': 'Brandenburg', 'cottbus': 'Brandenburg', 'frankfurt (oder)': 'Brandenburg',
  // Sachsen-Anhalt
  'magdeburg': 'Sachsen-Anhalt', 'halle': 'Sachsen-Anhalt', 'dessau': 'Sachsen-Anhalt',
  // Thüringen
  'erfurt': 'Thüringen', 'jena': 'Thüringen', 'gera': 'Thüringen', 'weimar': 'Thüringen',
  // Mecklenburg-Vorpommern
  'rostock': 'Mecklenburg-Vorpommern', 'schwerin': 'Mecklenburg-Vorpommern',
  'neubrandenburg': 'Mecklenburg-Vorpommern', 'stralsund': 'Mecklenburg-Vorpommern',
  // Saarland
  'saarbrücken': 'Saarland', 'saarlouis': 'Saarland', 'neunkirchen': 'Saarland',
};

// Ordnet eine Stadt/Standort-Eingabe einer Region zu. Robust gegen PLZ,
// Zusätze wie "am Main" und Eingaben wie "50667 Köln" oder "Köln, NRW".
export const categorizeRegion = (city?: string | null): Region => {
  if (!city) return 'Unbekannt';
  const raw = city.trim().toLowerCase();
  if (!raw) return 'Unbekannt';

  // PLZ entfernen, nur den Teil vor Komma/Schrägstrich betrachten.
  const cleaned = raw.replace(/\d{4,5}/g, '').replace(/[,/].*$/, '').trim();

  // 1) Direkter Treffer auf bekannte Stadt.
  if (CITY_REGION[cleaned]) return CITY_REGION[cleaned];

  // 2) Teilstring-Treffer (z. B. "frankfurt am main" enthält "frankfurt").
  for (const [name, region] of Object.entries(CITY_REGION)) {
    if (cleaned.includes(name)) return region;
  }

  // 3) Nutzer hat evtl. direkt ein Bundesland eingegeben.
  const asRegion = REGIONS.find(
    (r) => r !== 'Unbekannt' && (r.toLowerCase() === cleaned || cleaned.includes(r.toLowerCase()))
  );
  if (asRegion) return asRegion;

  return 'Unbekannt';
};
