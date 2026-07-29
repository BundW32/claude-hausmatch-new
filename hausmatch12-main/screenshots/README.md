# Screenshots für Werbevideos

Aufnahmen der HausMatch-Website als Schnittmaterial. Erzeugt mit
`npm run screenshots` (siehe `scripts/screenshots.mjs`).

## Ordner

| Ordner | Auflösung | Verwendung |
| --- | --- | --- |
| `desktop-16x9/` | 3840 × 2160 (1920 × 1080 @2x) | Querformat: YouTube, Website, Präsentation |
| `mobile-9x16/` | 1080 × 1920 (540 × 960 @2x) | Hochformat: Reels, Shorts, TikTok |
| `highlights/` | wie oben | Einzelzustände mit Interaktion |

Je Seite gibt es zwei Dateien:

- `<name>.png` — nur der sichtbare Bereich, direkt schnittfertig im Zielformat.
- `<name>-fullpage.png` — die komplette Seite von oben bis unten. Gedacht für
  Scroll-/Pan-Fahrten: im Schnittprogramm als Standbild einsetzen und langsam
  vertikal bewegen.

## Seiten

| Datei | Route | Inhalt |
| --- | --- | --- |
| `01-startseite` | `/#/` | Hero „Hausverwaltung finden. Gemeinsam stärker." |
| `02-fuer-suchende` | `/#/seekers` | Für Eigentümer und Suchende |
| `03-fuer-verwalter` | `/#/managers` | Für Hausverwaltungen |
| `04-vermittlung` | `/#/vermittlung` | Verwalter-Suche |
| `05-marktplatz` | `/#/marktplatz` | Aufträge, Gesuche, Angebote |
| `06-ki-berater` | `/#/ki-berater` | KI-Berater |
| `07-kreditrechner` | `/#/kreditrechner` | Immobilien-Kalkulator |
| `08-ratgeber` | `/#/ratgeber` | Ratgeber-Artikel |
| `09-netzwerk` | `/#/network` | Netzwerk (ausgeloggt: Registrierungs-Hinweis) |
| `10-registrieren` | `/#/register` | Rollenauswahl bei der Registrierung |
| `11-ueber-uns` | `/#/about` | Über HausMatch |
| `12-kontakt` | `/#/contact` | Kontakt |

## Highlights

| Datei | Zustand |
| --- | --- |
| `h1-startseite-suche-gefuellt` | Startseite, „München" im Suchfeld |
| `h2-startseite-rolle-makler` | Startseite, Rolle „Immobilienmakler" gewählt |
| `h3-vermittlung-suche-gefuellt` | Vermittlung, Suchbegriff eingetragen |
| `h4-kreditrechner-rendite` | Kalkulator, Tab „Rendite" |
| `h5-kreditrechner-tilgungsplan` | Kalkulator, Tab „Tilgungsplan" mit Tabelle |
| `h6-marktplatz-filter-auftrag` | Marktplatz, Filter „Auftrag" aktiv |
| `h7-mobil-menue-offen` | Mobil, geöffnetes Navigationsmenü |

## Neu erzeugen

```bash
npm install
npx playwright install chromium     # einmalig
cp .env.example .env.local          # Firebase-Werte eintragen
npm run dev                         # Terminal 1
npm run screenshots                 # Terminal 2
```

Der Zielordner lässt sich als Argument übergeben:
`node scripts/screenshots.mjs /pfad/zum/ordner`. Eine andere Basis-URL geht
über `SCREENSHOT_BASE_URL`, ein bereits installiertes Chromium über
`PLAYWRIGHT_CHROMIUM_PATH`.

## Hinweise zum Inhalt

- Die Aufnahmen entstehen im **ausgeloggten Zustand**. Geschützte Bereiche
  (Netzwerk, Dashboard, Forum, Nachrichten) zeigen deshalb den
  Registrierungs-Hinweis statt echter Inhalte.
- Die Verwalter-Suche auf `/#/vermittlung` und der KI-Berater rufen
  Server-Endpunkte auf, die im lokalen Dev-Server nicht laufen — dort ist
  jeweils der leere Ausgangszustand zu sehen.
