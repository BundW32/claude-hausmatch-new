import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const articles = [
  {
    id: 1,
    category: 'Kauf & Finanzierung',
    title: 'Wie viel Eigenkapital brauche ich beim Immobilienkauf?',
    summary: 'Eigenkapital ist der wichtigste Hebel für günstige Konditionen. Was zählt dazu, wie viel ist nötig, und was sollten Sie vor der Finanzierung klären?',
    content: `**Die Faustformel und warum sie alleine nicht reicht**
Banken empfehlen mindestens 20–30 % des Kaufpreises als Eigenkapital. Der Grund: Je höher Ihr Eigenkapitalanteil, desto niedriger der Beleihungsauslauf (LTV) und desto bessere Zinssätze bietet die Bank. Bei einem LTV unter 60 % erhalten Sie oft die besten Konditionen am Markt.

**Was zählt als Eigenkapital?**
- Sparguthaben, Tages- und Festgeldkonten (sofort verfügbar)
- Wertpapierdepots (je nach Bank zu 60–80 % anrechenbar, da Kursschwankungen möglich)
- Bausparverträge (auch nicht-zuteilungsreife können anteilig zählen)
- Rückkaufswerte aus Lebensversicherungen
- Eigenleistungen beim Bau ("Muskelhypothek"), bewertbar mit ersparten Handwerkerkosten
- Schenkungen und Erbschaften (Nachweise erforderlich)
- Guthaben auf Riester-Konten (über Wohnriester nutzbar)

**Was gehört NICHT zum Eigenkapital?**
Verbraucherkredite, die Sie kurz vor dem Immobilienkauf aufnehmen, werden von Banken negativ bewertet. Auch das Eigenkapital eines Mitantragstellers muss dokumentiert sein.

**Die Nebenkostenfalle**
Die Kaufnebenkosten betragen typischerweise 10–15 % des Kaufpreises und sollten idealerweise komplett aus Eigenkapital finanziert werden:
- Grunderwerbsteuer: je nach Bundesland 3,5 % (Bayern, Sachsen) bis 6,5 % (NRW, Thüringen, Schleswig-Holstein)
- Notar- und Grundbuchkosten: ca. 1,5–2 % des Kaufpreises
- Maklercourtage (wenn anfallend): 0–3,57 % Käuferanteil, je nach Vereinbarung

**Eigenkapital schonen: Wann es Sinn macht**
In bestimmten Situationen kann es sinnvoll sein, weniger Eigenkapital einzusetzen und liquide Mittel zu erhalten, etwa für geplante Modernisierungen oder als Sicherheitspuffer. Dies erhöht zwar den Zinssatz, kann aber die Gesamtflexibilität erhöhen.

**Bonität genauso wichtig wie Eigenkapital**
Neben dem Eigenkapital prüfen Banken: SCHUFA-Score, Einkommensnachweise (meist letzten 3 Monate Lohnabrechnungen + 2 Steuerbescheide), Beschäftigungsverhältnis (unbefristet bevorzugt), bestehende Kreditverpflichtungen und Lebenshaltungskosten.

**Typische Beispielrechnung**
Kaufpreis 400.000 € in NRW:
- Grunderwerbsteuer (6,5 %): 26.000 €
- Notar & Grundbuch (ca. 1,7 %): 6.800 €
- Maklerprovision (3,57 % Käuferanteil, falls fällig): 14.280 €
- Summe Nebenkosten: ca. 47.000 €
- Empfohlenes Mindest-EK (20 % + Nebenkosten): ca. 127.000 €

**Unsere Empfehlung:** Simulieren Sie verschiedene Szenarien mit unserem Kreditrechner, bevor Sie in Bankgespräche gehen. So kennen Sie Ihren Verhandlungsspielraum.`,
    readTime: '6 min',
    icon: '🏠'
  },
  {
    id: 2,
    category: 'WEG & Recht',
    title: 'WEG-Reform 2020: Was Eigentümer heute wissen müssen',
    summary: 'Die umfassendste WEG-Reform seit 1951 hat das Wohnungseigentumsrecht grundlegend modernisiert. Die wichtigsten Änderungen und ihre praktischen Auswirkungen.',
    content: `**Warum die Reform notwendig war**
Das alte WEG stammte aus 1951 und war für heutige Anforderungen (Digitalisierung, Energiewende, E-Mobilität) nicht ausgelegt. Seit 1. Dezember 2020 gilt das modernisierte WEG.

**Eigentümerversammlungen**
Früher waren Versammlungen nur beschlussfähig, wenn mehr als 50 % der Miteigentumsanteile vertreten waren. Das führte oft zu teueren Zweitversammlungen. Neu: Eigentümerversammlungen sind immer beschlussfähig, unabhängig von der Anzahl der Erschienenen. Zudem ist jetzt auch eine Online-Teilnahme (Zuschaltoption) gesetzlich vorgesehen, wenn die Gemeinschaft das beschließt.

**Umlaufbeschlüsse digital**
Früher mussten Umlaufbeschlüsse von allen Eigentümern schriftlich unterzeichnet werden. Neu: Eine Mehrheit von mehr als der Hälfte aller Stimmen genügt, und dies kann per E-Mail oder über ein Eigentümerportal erfolgen. Das beschleunigt Entscheidungen erheblich.

**Bauliche Veränderungen: Mehr Rechte für den Einzelnen**
Einzelne Eigentümer können nun bestimmte Maßnahmen alleine beantragen und auf eigene Kosten durchführen, wenn die WEG keine schnelle Entscheidung trifft:
- Ladestation für Elektroautos (Wallbox)
- Barrierereduzierende Maßnahmen (Rampen, breitere Türen)
- Einbruchschutz (Sicherheitsschlösser, Alarmanlagen)
- Glasfaseranschluss
- Verpflichtendes Vetorecht besteht nur noch in Ausnahmefällen

**Verwalter: Neue Pflichten und stärkere Kontrolle**
- Einfachere Abberufung: Die Gemeinschaft kann den Verwalter nun jederzeit mit einfacher Mehrheit abberufen (früher nur aus wichtigem Grund möglich)
- Zertifizierungspflicht: Seit 1. Dezember 2022 müssen neue Verwalter eine IHK-Prüfung ablegen (§ 26a WEG). Bestehende Verwalter hatten eine Übergangsfrist bis 1. Juni 2024
- Verwaltervertrag läuft bei Abberufung spätestens nach 6 Monaten aus
- Stärkere Rechenschaftspflichten gegenüber der Gemeinschaft

**Rücklagen: Neue Pflicht zur angemessenen Bildung**
Die Gemeinschaft ist nun verpflichtet, eine "angemessene" Instandhaltungsrücklage zu bilden. Eine Pflicht zur Erstellung eines Vermögensberichts (statt nur Jahresabrechnung) tritt hinzu.

**Sondereigentum erweitert**
Terrassen, Gartenflächen und Stellplätze können nun leichter als Sondereigentum begründet werden. Das vereinfacht Teilungserklärungen bei Neubauten.

**Was das für Sie bedeutet**
Prüfen Sie: Entsprechen Ihre Teilungserklärung und Gemeinschaftsordnung noch dem neuen Recht? Ist Ihr Verwalter zertifiziert? Hat Ihre WEG ausreichende Rücklagen für die nächsten 10–15 Jahre gebildet?`,
    readTime: '7 min',
    icon: '⚖️'
  },
  {
    id: 3,
    category: 'Verwaltung',
    title: 'Den richtigen Hausverwalter finden: 8 entscheidende Kriterien',
    summary: 'Die Wahl des Verwalters entscheidet über Ihren Aufwand, Ihre Rendite und den Werterhalt Ihrer Immobilie. Diese Kriterien helfen Ihnen bei der Auswahl.',
    content: `**Warum die Verwalterauswahl so wichtig ist**
Ein guter Verwalter spart Ihnen nicht nur Zeit, er verhindert kostspielige Fehler, sichert den Mietfluss und erhält den Wert Ihres Objekts. Ein schlechter Verwalter hingegen kann durch verschleppte Instandhaltung, Abrechnungsfehler oder schlechtes Mieterscreening erheblichen Schaden anrichten.

**1. Lokale Expertise und Marktkenntnisse**
Ein Verwalter, der den Mikrostandort kennt, hat bessere Handwerker-Kontakte, kennt lokale Mietpreisentwicklungen und kann Leerstände schneller beheben. Fragen Sie: Wie viele Objekte verwalten Sie in diesem Stadtbezirk? Welche Handwerker nutzen Sie?

**2. Qualifikation und Zertifizierung**
- Pflicht: Gewerbeerlaubnis nach § 34c GewO (Gewerbebehörde prüfbar)
- Empfohlen: IHK-Sachkundenachweis "Geprüfter WEG-Verwalter" oder "Geprüfter Immobilienfachwirt"
- Berufsverband: DDIV (Dachverband Deutscher Immobilienverwalter) oder VDIV-Mitgliedschaft zeigt Qualitätsanspruch
- WEG-Verwalter: Seit Dezember 2022 ist der Sachkundenachweis nach § 26a WEG gesetzlich vorgeschrieben

**3. Unternehmensgröße und Kapazität**
Die Unternehmensgröße sollte zu Ihrem Objekt passen. Ein Solo-Selbstständiger kann bei Urlaub oder Krankheit schnell zum Engpass werden. Andererseits gehen Sie in einem sehr großen Unternehmen möglicherweise unter. Fragen Sie: Wie viele Einheiten verwaltet ein Mitarbeiter? Wer ist mein Hauptansprechpartner?

**4. Digitales Management und Transparenz**
Moderne Verwalter bieten:
- Eigentümerportal mit Dokumentenzugang (Protokolle, Abrechnungen, Belege)
- Mieterportal für Schadensmeldungen und Kommunikation
- Digitale Jahresabrechnung mit klarer Aufschlüsselung
- Online-Zugang zu Kontoauszügen und Rücklagenstand

**5. Erreichbarkeit und Notfallmanagement**
- Definierte Reaktionszeiten bei Anfragen (max. 24–48 Stunden für Nicht-Notfälle)
- 24/7-Notfallnummer für Wassereinbruch, Heizungsausfall, Einbruch
- Klar geregelte Urlaubsvertretung

**6. Vertrag und Kündigungskonditionen**
Typische Laufzeiten: 1–3 Jahre. Prüfen Sie:
- Kündigungsfrist und -gründe
- Was ist im Grundleistungspaket enthalten, was wird extra berechnet?
- Ist eine Mindestlaufzeit vereinbart?
- Welche Kosten entstehen bei vorzeitiger Kündigung?

**7. Referenzen und Bewertungen**
Lassen Sie sich Referenzen von bestehenden Kunden geben, die ähnliche Objekte haben. Prüfen Sie auch Online-Bewertungen (Google, Immobilienscout24-Verwalterliste). Fragen Sie andere Eigentümer in Ihrem Netzwerk.

**8. Kommunikationsstil und persönliche Chemie**
Unterschätzen Sie nicht den "Bauchfaktor": Der Verwalter ist Ihr langfristiger Partner. Reagiert er schnell auf Anfragen? Erklärt er Sachverhalte verständlich? Ist er transparent bei Problemen oder beschönigt er sie?

**Checkliste für das Erstgespräch**
☐ Welche Software nutzen Sie für die Verwaltung?
☐ Wie ist Ihre Notfallbereitschaft organisiert?
☐ Wie viele Einheiten betreut Ihr Team insgesamt?
☐ Welche Versicherungen haben Sie (Berufshaftpflicht, Vertrauensschaden)?
☐ Können Sie Referenzkunden benennen?
☐ Wie läuft die Übergabe bei Verwalterwechsel ab?

**Unser Tipp:** Holen Sie mindestens 3 Angebote ein und vergleichen Sie nicht nur den Leistungsumfang, sondern auch den ersten Eindruck in der Kommunikation.`,
    readTime: '8 min',
    icon: '🔍'
  },
  {
    id: 4,
    category: 'Investment',
    title: 'Immobilienrendite richtig berechnen: Brutto, Netto und Eigenkapitalrendite',
    summary: 'Welche Rendite wirft Ihre Immobilie wirklich ab? Lernen Sie den Unterschied zwischen Brutto-, Netto- und Eigenkapitalrendite und welche Kennzahlen wirklich zählen.',
    content: `**Warum die Bruttorendite alleine nicht aussagekräftig ist**
Makler und Verkäufer nennen oft die Bruttorendite. Sie klingt gut, lässt aber alle relevanten Kosten außen vor. Für eine fundierte Investitionsentscheidung brauchen Sie die Nettorendite.

**Bruttorendite (Einstiegscheck)**
Formel: Jahres-Kaltmiete ÷ Kaufpreis × 100

Beispiel: Jahresmiete 18.000 € ÷ Kaufpreis 300.000 € = 6,0 % Bruttorendite

Die Bruttorendite eignet sich für einen schnellen Erstvergleich zwischen Objekten. Sie sagt aber nichts über die tatsächliche Wirtschaftlichkeit aus.

**Nettorendite (die relevante Kennzahl)**
Formel: (Jahresmiete − nicht umlegbare Kosten) ÷ (Kaufpreis + Nebenkosten) × 100

Nicht umlegbare Kosten typischerweise:
- Hausverwaltungskosten (WEG- und/oder Mietverwaltung)
- Instandhaltungsrücklage (Empfehlung: 1,0–1,5 € je m² pro Monat bei älteren Objekten)
- Leerstandsrisiko (Puffer von 2–5 % der Jahresnettomiete einkalkulieren)
- Nicht umlagefähige Betriebskosten (Grundsteuer wird i.d.R. umgelegt, bei Leerstand aber nicht)

Beispiel weitergeführt:
- Jahresmiete: 18.000 €
- Verwaltungskosten: −1.200 €
- Instandhaltungsrücklage: −1.500 €
- Leerstandspuffer (3 %): −540 €
- Reinertrag: 14.760 €
- Kaufpreis + Nebenkosten (10 %): 330.000 €
- Nettorendite: 14.760 € ÷ 330.000 € × 100 = **4,47 %**

Die Nettorendite liegt damit rund 1,5 % unter der Bruttorendite, ein realistischer Unterschied.

**Eigenkapitalrendite und Leverage-Effekt**
Wenn Sie mit Fremdkapital finanzieren, erhöht sich die Eigenkapitalrendite, sofern der Kreditzins unter der Nettorendite liegt (positiver Leverage-Effekt).

Beispiel:
- Kaufpreis inkl. Nebenkosten: 330.000 €
- Eigenkapitaleinsatz: 100.000 €
- Darlehen: 230.000 €, Zinssatz: 3,5 %, Zinslast: 8.050 €/Jahr
- Reinertrag nach Zinsen: 14.760 − 8.050 = 6.710 €
- Eigenkapitalrendite: 6.710 ÷ 100.000 × 100 = **6,71 %** (vor Tilgung und Steuer)

Steigt der Zinssatz über die Nettorendite, kehrt sich der Effekt um (negativer Leverage).

**Orientierungswerte für den deutschen Markt**
- Bruttorendite > 5 %: Interessantes Objekt, prüfenswert
- Bruttorendite > 7 %: Sehr attraktiv (kommt in Toplagen kaum mehr vor)
- Bruttorendite 3–5 %: Kann sich noch lohnen, wenn Wertsteigerung oder Steuervorteile eingerechnet werden
- Bruttorendite < 3 %: Nur mit starker Wertsteigerungserwartung oder als "Betongold" vertretbar

**Wichtige Ergänzungskennzahlen**
- **Vervielfältiger / Kaufpreisfaktor:** Kaufpreis ÷ Jahreskaltmiete. Je niedriger, desto günstiger. Wert 20 entspricht 5 % Bruttorendite, Wert 33 entspricht ca. 3 %
- **Cashflow:** Monatlicher Überschuss nach ALLEN Kosten und Kreditraten. Zeigt, ob das Objekt sich selbst trägt
- **Tilgungsäquivalent:** Die Tilgung des Darlehens ist kein "Kosten"-Faktor, sondern Vermögensaufbau

**Steuer nicht vergessen**
Mieteinnahmen sind einkommensteuerpflichtig. Gleichzeitig können Sie Zinskosten, Verwaltungskosten, Instandhaltung und Abschreibung (AfA: 2 % p.a. auf den Gebäudewert bei Baujahr ab 1925) steuerlich geltend machen. Holen Sie sich frühzeitig steuerliche Beratung.`,
    readTime: '8 min',
    icon: '📊'
  },
  {
    id: 5,
    category: 'Mietrecht',
    title: 'Mieterhöhung rechtssicher durchführen: Der komplette Leitfaden',
    summary: 'Mieterhöhungen sind möglich, aber an strenge gesetzliche Voraussetzungen geknüpft. Formfehler machen das Schreiben unwirksam. So gehen Sie richtig vor.',
    content: `**Grundvoraussetzungen: Alle müssen erfüllt sein**
Eine Mieterhöhung zur ortsüblichen Vergleichsmiete ist nur zulässig, wenn:
1. Die Miete mindestens 12 Monate unverändert geblieben ist (Wartejahr)
2. Das Erhöhungsverlangen schriftlich erfolgt und ordnungsgemäß begründet ist
3. Die Kappungsgrenze eingehalten wird
4. Eine Ankündigungsfrist von mindestens 2 Monaten gewahrt wird
5. Der Mieter zugestimmt hat (oder Zustimmungsklage erfolgt)

**Kappungsgrenze: Das wichtigste Limit**
- Standard: Miete darf in 3 Jahren um maximal 20 % steigen
- Angespannte Wohnungsmärkte: Nur 15 % in 3 Jahren (gilt z.B. in München, Hamburg, Berlin und vielen anderen Städten)
- Welche Gebiete als angespannt gelten, regeln die jeweiligen Landesregierungen per Verordnung

**Mietpreisbremse (Neuvermietung)**: Die Mietpreisbremse gilt bei Neuvermietung (nicht bei Mieterhöhungen im laufenden Mietverhältnis) und begrenzt die Miete auf 110 % der ortsüblichen Vergleichsmiete in ausgewiesenen Gebieten.

**Begründung: Drei Wege**
Option 1 (Mietspiegel): Wenn Ihre Gemeinde einen (qualifizierten) Mietspiegel hat, können Sie diesen direkt zitieren. Dies ist die einfachste und günstigste Methode.

Option 2 (Vergleichswohnungen): Sie benennen mindestens 3 vergleichbare Wohnungen in der Gemeinde, die zu einer höheren Miete vermietet sind. Wohnungen, Lage, Ausstattung und Größe müssen vergleichbar sein.

Option 3 (Sachverständigengutachten): Ein öffentlich bestellter Gutachter erstellt ein Gutachten zur ortsüblichen Vergleichsmiete. Teuer, aber rechtssicher.

**Das richtige Formular**
Das Mieterhöhungsschreiben muss enthalten:
- Vollständige Anschrift der Mietpartei(en)
- Genaue Bezeichnung der Mietwohnung
- Aktuelle Nettokaltmiete
- Neue gewünschte Nettokaltmiete
- Begründung (Mietspiegel mit Einordnung ODER Vergleichswohnungen ODER Gutachten)
- Angabe, dass Kappungsgrenze eingehalten wird
- Aufforderung zur Zustimmung
- Unterschrift des Vermieters

**Fristen und Zustimmung**
- Das Erhöhungsschreiben muss dem Mieter spätestens am letzten Tag eines Kalendermonats zugehen
- Der Mieter hat dann 2 volle Monate Zeit zur Überlegung
- Die erhöhte Miete gilt ab dem übernächsten Monatsersten
- Der Mieter kann widersprechen, dann müssen Sie auf Zustimmung klagen

**Modernisierungsmieterhöhung**
Nach einer Modernisierung (Heizungstausch, Dämmung, neues Bad) können 8 % der für die Wohnung aufgewandten Modernisierungskosten jährlich auf die Miete umgelegt werden. Achtung: Erhöhung auf max. 3 € je m² in 6 Jahren gedeckelt; bei Wohnungen unter 7 € Miete je m² auf max. 2 €. Ankündigungspflicht 3 Monate vor Beginn der Arbeiten.

**Typische Fehler die zur Unwirksamkeit führen**
- Falsche oder fehlende Begründung
- Beginn der 12-Monats-Frist nicht eingehalten
- Kappungsgrenze überschritten
- Schreiben nicht an alle Mieter adressiert (bei mehreren Mietern)
- Falscher Mietspiegel-Jahrgang zitiert

**Unser Tipp:** Bei Unsicherheit lieber einen Fachanwalt für Mietrecht einschalten. Ein formunwirksames Erhöhungsschreiben verzögert die Mieterhöhung um Monate.`,
    readTime: '9 min',
    icon: '📋'
  },
  {
    id: 6,
    category: 'Energie & Sanierung',
    title: 'Energetische Sanierung 2025/2026: Förderungen, Pflichten und Strategie',
    summary: 'BEG, BAFA, steuerliche Absetzbarkeit: Der Förderdschungel ist komplex. Dazu kommen neue gesetzliche Pflichten. Was Sie jetzt wissen und planen müssen.',
    content: `**Gesetzliche Pflichten zuerst: Was ist verpflichtend?**
Seit dem GEG (Gebäudeenergiegesetz) gelten u.a. folgende Pflichten:
- Neue Heizungsanlagen müssen seit 2024 zu mindestens 65 % erneuerbare Energien nutzen (mit langen Übergangsfristen für Bestandsbauten)
- Beim Eigentümerwechsel: Dachbodendämmung und Kellerdeckendämmung innerhalb von 2 Jahren
- Heizkesselpflicht: Konstanttemperaturkessel über 30 Jahre müssen ausgetauscht werden (mit Ausnahmen für Selbstnutzer)

**KfW-Bundesförderung Effiziente Gebäude (BEG)**
Die BEG ist das wichtigste Förderprogramm für energetische Sanierungen.

Wohngebäude-Kredit (261): Günstige Kredite für Sanierung zum KfW-Effizienzhaus-Standard, kombinierbar mit Tilgungszuschüssen von 5–45 %.

Wohngebäude-Zuschuss (Einzelmaßnahmen): 15 % Zuschuss auf förderfähige Kosten für:
- Gebäudehülle (Dämmung, Fenster, Türen)
- Anlagentechnik (außer Heizung)
- Heizungsoptimierung

Heizungsförderung (458): Bei Austausch einer fossilen Heizung:
- Grundförderung: 30 % der förderfähigen Kosten
- Klimageschwindigkeits-Bonus: +20 % bei funktionierender Gas-/Ölheizung, die vor 2045 ausgetauscht wird (bis 2028 befristet)
- Einkommens-Bonus: +30 % bei Haushaltseinkommen ≤ 40.000 € p.a.
- Maximal kombinierbar: 70 % Gesamtförderung möglich
- Förderfähige Kosten: max. 30.000 € für Einfamilienhaus (entsprechend max. 21.000 € Zuschuss bei 70 %)

iSFP-Bonus (+5 %): Mit individuellem Sanierungsfahrplan erhalten Sie auf alle BEG-Einzelmaßnahmen 5 % Extrabonus.

**BAFA-Förderung**
- Heizungsoptimierung (Hydraulischer Abgleich): Bis zu 30 % Zuschuss
- Renewable Ready: Förderung für Vorbereitung auf erneuerbare Energien
- Für Solarthermie, Biomasse-Anlagen und Wärmepumpen (Heizungsförderung jetzt über KfW 458)

**Steuerliche Absetzbarkeit (§ 35c EStG)**
Für selbst genutzte Immobilien:
- 20 % der Sanierungskosten absetzbar, auf 3 Jahre verteilt (je max. 7 % im 1. und 2. Jahr, 6 % im 3. Jahr)
- Maximum: 40.000 € Steuerermäßigung bei Kosten von 200.000 €
- Nicht kombinierbar mit BEG-Zuschüssen (entweder/oder!)

Für vermietete Immobilien:
- Erhaltungsaufwand: sofort als Werbungskosten absetzbar
- Herstellungsaufwand: über die Nutzungsdauer abzuschreiben
- Steuerberater hinzuziehen, da die Abgrenzung komplex ist

**Reihenfolge ist entscheidend: Erst Förderung beantragen, dann beauftragen!**
Das gilt für alle KfW- und BAFA-Förderungen. Der häufigste Fehler: Erst beauftragen, dann Förderung beantragen, dann ist sie weg. Ausnahme: Notfallmaßnahmen bei Heizungsausfall.

**Strategische Sanierungsreihenfolge**
1. Luftdichtheit und Dämmung zuerst (reduziert Heizlast)
2. Dann Heizungstausch (kleinere Anlage nötig, wenn Gebäude gedämmt)
3. Lüftungsanlage (bei sehr dichter Hülle wichtig gegen Feuchteschäden)

**Energieberater: Pflicht bei Förderung**
Für KfW-Förderung ab bestimmten Beträgen ist ein zugelassener Energieeffizienz-Experte (auf der Expertenliste der DENA) als Planungsbegleiter Pflicht. Dessen Kosten sind ebenfalls förderfähig.`,
    readTime: '9 min',
    icon: '♻️'
  },
  {
    id: 7,
    category: 'WEG & Recht',
    title: 'Nebenkostenabrechnung: Rechte, Fristen und häufige Fehler',
    summary: 'Die Nebenkostenabrechnung ist ein häufiger Streitpunkt. Was muss drin sein, welche Fristen gelten, und welche Fehler machen Abrechnungen unwirksam?',
    content: `**Was ist die Nebenkostenabrechnung?**
Die Nebenkostenabrechnung (auch: Betriebskostenabrechnung) legt die tatsächlich angefallenen Nebenkosten eines Jahres den Mietern um. Am Ende steht eine Nachzahlung oder Gutschrift.

**Abrechnungsfrist: 12 Monate**
Der Vermieter muss die Abrechnung innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums zustellen. Wird diese Frist verpasst, verliert der Vermieter seinen Anspruch auf Nachzahlungen (kann aber noch Guthaben auszahlen müssen).

**Was muss die Abrechnung enthalten?**
- Vollständige Auflistung aller Gesamtkosten
- Angabe des zugrunde liegenden Verteilerschlüssels für jede Position
- Berechnung des Mieteranteils
- Abzug der geleisteten Vorauszahlungen
- Ergebnis: Nachzahlung oder Guthaben

**Umlagefähige vs. nicht-umlagefähige Kosten**
Umlagefähig (laut BetrKV): Grundsteuer, Wasser/Abwasser, Heizung, Warmwasser, Aufzug, Straßenreinigung, Müllabfuhr, Gebäudereinigung, Gartenpflege, Beleuchtung, Schornsteinreinigung, Sach- und Haftpflichtversicherung, Hausmeister (Anteile), Kabel/Antenne, Wäschepflege (wenn vorhanden), Sonstige vereinbarte Kosten

Nicht umlagefähig: Verwaltungskosten, Instandhaltung und Reparaturen, Leerstandskosten, Anschaffungen (Waschmaschinen, Möbel etc.)

**Typische Verteilerschlüssel**
- Wohnfläche (qm): Häufigster Schlüssel für Grundkosten
- Personenanzahl: Manchmal für Wasser/Abwasser
- Verbrauchsmessung: Pflicht bei Heizkosten (mind. 50–70 % nach Verbrauch abzurechnen)
- Wohneinheiten: Für bestimmte Positionen möglich

**Die Heizkostenabrechnung: Sonderfall**
Für Heizung und Warmwasser gilt die Heizkostenverordnung (HeizkostenV). Mindestens 50 % (empfohlen: 70 %) müssen nach tatsächlichem Verbrauch abgerechnet werden. Das ist Pflicht, auch wenn der Vermieter das nicht möchte. Fehlt ein Verbrauchserfassungsgerät, darf der Mieter 15 % der Heizkosten kürzen.

**Belegkopien: Ihr Einsichtsrecht**
Als Mieter haben Sie das Recht, Belege einzusehen (nicht immer Kopien zu verlangen). Praktisch: Sie können beim Vermieter oder Verwalter Einsicht nehmen oder, nach einem BGH-Urteil, Kopien verlangen, wenn der Aufwand zumutbar ist. Kosten für Kopien können dem Mieter auferlegt werden.

**Einspruchsfrist: 12 Monate**
Mieter können Einwände gegen die Abrechnung innerhalb von 12 Monaten nach Zugang erheben. Danach sind Einwände ausgeschlossen (außer bei arglistiger Täuschung).

**Häufige Fehler, die Abrechnungen unwirksam machen**
- Nicht umlagefähige Kosten aufgeführt
- Falscher oder nicht vereinbarter Verteilerschlüssel
- Fehlende Gesamtkosten (nur Mieteranteil angegeben)
- Abrechnungszeitraum stimmt nicht mit dem vereinbarten überein
- Heizkosten nicht nach Verbrauch abgerechnet

**Praktischer Tipp für Vermieter**
Bewahren Sie alle Belege (Rechnungen, Kontoauszüge) 12 Monate über das Abrechnungsjahr hinaus auf. Nutzen Sie eine Verwaltungssoftware, sie minimiert Abrechnungsfehler erheblich.`,
    readTime: '7 min',
    icon: '🧾'
  },
  {
    id: 8,
    category: 'Kauf & Finanzierung',
    title: 'Notartermin und Kaufvertrag: Was Sie wissen müssen',
    summary: 'Der Notartermin ist der entscheidende Moment beim Immobilienkauf. Was steht im Kaufvertrag, auf was müssen Sie achten, und welche Rechte haben Sie?',
    content: `**Warum ist der Notar Pflicht?**
Immobilienkaufverträge müssen in Deutschland notariell beurkundet werden (§ 311b BGB). Ohne Notar ist der Vertrag nichtig. Der Notar ist neutral: Er ist weder Vertreter des Käufers noch des Verkäufers, sondern gesetzlicher Betreuer aller Beteiligten.

**Wer wählt den Notar?**
Üblicherweise der Käufer, da er auch die Notarkosten trägt. Sie können jeden Notar in Deutschland beauftragen. Es lohnt sich, vorab einen Notar zu kontaktieren, der Erfahrung mit Immobilientransaktionen hat.

**Ablauf bis zum Notartermin**
1. Einigung zwischen Käufer und Verkäufer (Preis, Übergabetermin, Inventar)
2. Käufer übermittelt Daten an Notariat (Personalien, Finanzierungsdetails)
3. Notar erstellt Vertragsentwurf (meist 2–4 Wochen vor Termin)
4. Empfehlung: Entwurf mindestens 14 Tage vorher lesen und prüfen lassen
5. Beurkundungstermin beim Notar
6. Auflassung (Einigungserklärung im Grundbuch) und Eintragung Auflassungsvormerkung
7. Kaufpreiszahlung (nach Vorliegen aller Voraussetzungen)
8. Eintragung des Eigentumsübergangs im Grundbuch

**Was steht im Kaufvertrag? Eine Checkliste**
- Kaufpreis und Zahlungsmodalitäten
- Beschreibung des Kaufgegenstands (Grundstück, Gebäude, Zubehör, Inventar)
- Übergabetermin und -bedingungen
- Gewährleistungsausschluss (meist "unter Ausschluss jeder Gewährleistung für Sachmängel")
- Belastungen im Grundbuch (Grundschulden, Dienstbarkeiten): Werden sie übernommen oder abgelöst?
- Auflassungsvormerkung
- Fälligkeitsvoraussetzungen für den Kaufpreis
- Regelungen zu Mietverhältnissen (bei vermietetem Objekt: "Kauf bricht nicht Miete")

**Auflassungsvormerkung: Ihr Schutz**
Nach der Beurkundung trägt der Notar eine Auflassungsvormerkung ins Grundbuch ein. Diese schützt Sie als Käufer: Der Verkäufer kann die Immobilie nicht mehr an Dritte verkaufen oder weiter belasten. Sie zahlen erst, wenn die Vormerkung eingetragen ist.

**Fälligkeitsmitteilung: Wann Sie zahlen**
Der Kaufpreis wird erst fällig, wenn der Notar bestätigt, dass:
- Die Auflassungsvormerkung eingetragen ist
- Alle Belastungen (die nicht übernommen werden) gelöscht oder zur Löschung bewilligt sind
- Gemeindliche Vorkaufsrechte ausgeschlossen sind (Negativattest)
- Bank zugestimmt hat (bei Finanzierung)

**Risiken im Kaufvertrag: Auf diese Punkte achten**
- Gewährleistungsausschluss: Standard, schützt aber nicht bei arglistig verschwiegenen Mängeln
- Altlasten: Lassen Sie vor Vertragsschluss ein Grundbuchauszug und ggf. einen Altlastenkataster prüfen
- Erbbaurecht: Prüfen Sie, ob das Grundstück auf Erbpacht steht
- Vorkaufsrechte: Gemeinden oder Dritte können ein gesetzliches Vorkaufsrecht haben
- Baulast: Prüfen Sie das Baulastenverzeichnis der Gemeinde

**Kosten des Notartermins**
Notarkosten und Grundbuchgebühren richten sich nach dem Kaufpreis (GNotKG):
- Typisch bei 400.000 € Kaufpreis: Notar ca. 1.500–2.000 €, Grundbuch ca. 500–800 €
- Hinzu kommt die Grunderwerbsteuer (3,5–6,5 %, je nach Bundesland), separat ans Finanzamt

**Tipp:** Lesen Sie den Vertragsentwurf sorgfältig durch und klären Sie alle Unklarheiten VOR dem Termin mit dem Notar oder einem Anwalt. Am Beurkundungstermin selbst haben Sie noch das Recht, Änderungen zu verlangen, aber es ist besser, diese vorher zu klären.`,
    readTime: '9 min',
    icon: '📝'
  },
  {
    id: 9,
    category: 'Investment',
    title: 'Steuern bei Immobilien: Was Vermieter und Käufer wissen müssen',
    summary: 'Immobilien bieten steuerliche Vorteile, aber auch Pflichten. Ein Überblick über Abschreibung, Werbungskosten, Spekulationssteuer und was beim Kauf zu beachten ist.',
    content: `**Grunderwerbsteuer beim Kauf**
Beim Erwerb einer Immobilie fällt einmalig Grunderwerbsteuer an. Sie ist ein fester Prozentsatz des Kaufpreises und variiert je nach Bundesland:
- 3,5 %: Bayern, Sachsen
- 4,0 %: Hamburg
- 5,0 %: Baden-Württemberg, Bremen, Mecklenburg-Vorpommern, Niedersachsen, Sachsen-Anhalt
- 6,0 %: Berlin, Hessen
- 6,5 %: Brandenburg, NRW, Saarland, Schleswig-Holstein, Thüringen

Die Grunderwerbsteuer ist nicht abzugsfähig, weder als Werbungskosten noch als Sonderausgabe. Sie erhöht die Anschaffungskosten (damit die AfA-Basis).

**Abschreibung (AfA): Ein wichtiger Steuervorteil**
Für vermietete Immobilien können Sie jährlich die Gebäudeabschreibung als Werbungskosten geltend machen:
- Gebäude mit Baujahr ab 1925: 2 % p.a. des Gebäudewerts
- Gebäude mit Baujahr vor 1925: 2,5 % p.a.
- Neue Wohngebäude ab 2023: 3 % p.a. (erhöhte AfA)
- Denkmalgeschützte Objekte: Erhöhte Abschreibung (bis zu 9 % in 8 Jahren + 7 % in weiteren 4 Jahren)

Wichtig: Abgeschrieben wird nur der Gebäudewert, nicht der Bodenwert. Die Aufteilung (oft 70/30 oder 80/20 Gebäude/Boden) muss nachvollziehbar begründet werden.

**Werbungskosten bei Vermietung**
Folgende Kosten mindern die zu versteuernden Mieteinnahmen:
- Schuldzinsen (nicht Tilgung!) des Immobilienkredits
- Gebäudeabschreibung (AfA)
- Grundsteuer
- Verwaltungskosten (WEG- und Mietverwaltung)
- Instandhaltung und Reparaturen (Erhaltungsaufwand)
- Fahrtkosten zur Immobilie
- Steuerberatungskosten (Anteil Immobilien)
- Kontoführungsgebühren für das Mietkonto
- Leerstandskosten (auch ohne Einnahmen absetzbar)

**Sofortabzug vs. Abschreibung bei Modernisierung**
- Erhaltungsaufwand (Reparaturen, Modernisierungen die keinen neuen Standard schaffen): sofort als Werbungskosten abzugsfähig
- Herstellungsaufwand (qualitative Verbesserungen, die einen höheren Standard schaffen): muss aktiviert und über die Nutzungsdauer abgeschrieben werden
- Anschaffungsnaher Aufwand (Achtung!): Renovierungskosten in den ersten 3 Jahren nach Kauf, die 15 % des Gebäudewerts übersteigen, müssen aktiviert werden

**Spekulationssteuer bei Verkauf**
Gewinne aus dem Verkauf von Immobilien sind steuerpflichtig, wenn:
- Die Immobilie innerhalb von 10 Jahren nach Kauf verkauft wird (Spekulationsfrist)
- Sie die Immobilie nicht im Jahr des Verkaufs und in den 2 Jahren davor selbst bewohnt haben

Höhe der Steuer: persönlicher Einkommensteuersatz auf den Gewinn (= Verkaufspreis abzügl. Kaufpreis + Nebenkosten + Abschreibungen). Abschreibungen erhöhen damit den steuerpflichtigen Gewinn!

**Grundsteuer**
Grundsteuer fällt jährlich an und basiert auf dem Einheitswert bzw. ab 2025 auf neuen Bewertungsgrundlagen (Grundsteuerreform). Sie ist als Vermieter umlagefähig. Als Selbstnutzer ist sie nicht absetzbar.

**Selbst genutzte Immobilie: weniger Steuervorteile**
Bei der selbst genutzten Immobilie gibt es kaum Steuervorteile: Schuldzinsen, Grundsteuer und Instandhaltung sind grundsätzlich nicht absetzbar. Ausnahme: Arbeitszimmer (strenge Voraussetzungen), energetische Sanierung (§ 35c EStG).

**Empfehlung**
Immobiliensteuern sind komplex und individuell. Holen Sie sich vor dem Kauf und spätestens nach der ersten Vermietung einen Steuerberater mit Immobilienschwerpunkt. Die Kosten dafür sparen Sie oft mehrfach durch optimale Gestaltung.`,
    readTime: '8 min',
    icon: '💶'
  },
  {
    id: 10,
    category: 'Verwaltung',
    title: 'Eigentümerversammlung: Vorbereitung, Ablauf und Beschlussfassung',
    summary: 'Die Eigentümerversammlung ist das zentrale Entscheidungsgremium in der WEG. Was muss eingeladen werden, wie wird abgestimmt, und was tun, wenn Beschlüsse rechtswidrig sind?',
    content: `**Was ist die Eigentümerversammlung?**
Die Eigentümerversammlung (EV) ist das gesetzlich vorgeschriebene Beschlussgremium der Wohnungseigentümergemeinschaft. Mindestens einmal jährlich muss sie einberufen werden (§ 24 WEG). Hier werden Jahresabrechnung und Wirtschaftsplan beschlossen, der Verwalter kontrolliert und größere Maßnahmen entschieden.

**Einberufung: Wer, wie, wann?**
- Wer darf einberufen: Primär der Verwalter; alternativ der Verwaltungsbeirat oder (bei Untätigkeit des Verwalters) jeder Eigentümer
- Form: Schriftlich (Brief oder E-Mail, wenn vereinbart) an alle Eigentümer
- Frist: Mindestens 2 Wochen vor dem Termin (kann in der Gemeinschaftsordnung verlängert sein)
- Inhalt der Einladung: Ort, Zeit, Tagesordnung mit allen Beschlusspunkten

**Beschlussfähigkeit seit 2020**
Seit der WEG-Reform 2020 ist jede ordnungsgemäß einberufene Versammlung beschlussfähig, unabhängig von der Zahl der erschienenen Miteigentumsanteile. Früher war eine Mindestanwesenheit erforderlich.

**Abstimmungsmehrheiten im Überblick**
- Einfache Mehrheit (mehr als die Hälfte der abgegebenen Stimmen): Standard für laufende Verwaltung, Jahresabrechnung, Wirtschaftsplan, Verwaltervertrag, kleinere Instandhaltungen
- Doppelt qualifizierte Mehrheit (mehr als ⅔ der Stimmen UND mehr als ½ der Miteigentumsanteile): Grundlegende Änderungen der Gemeinschaftsordnung, bestimmte bauliche Veränderungen
- Allstimmigkeit (alle Eigentümer zustimmen): Belastung des Gemeinschaftseigentums, Aufhebung der WEG

Standardmäßig: 1 Wohneinheit = 1 Stimme (Kopfprinzip). Aber in der Gemeinschaftsordnung kann abweichendes geregelt sein.

**Typische Tagesordnungspunkte**
1. Jahresabrechnung: Beschluss über Abrechnungsergebnisse je Wohnungseigentumseinheit
2. Wirtschaftsplan: Beschluss über Hausgeldhöhe und Budgetverteilung für das neue Jahr
3. Instandhaltungsrücklage: Überprüfung der Rücklagenhöhe
4. Beschluss über Instandhaltungsmaßnahmen
5. Verwalterbestellung oder -abberufung
6. Sonstige Beschlusspunkte (Gartengestaltung, Tierhaltung, etc.)

**Online-Teilnahme**
Seit 2020 kann die Gemeinschaft per Beschluss die Online-Teilnahme (Video-Zuschaltung) ermöglichen. Die Beschlussfassung selbst muss aber von präsenten oder bevollmächtigten Mitgliedern vorgenommen werden.

**Vertretung und Vollmacht**
Wer nicht teilnehmen kann, kann eine schriftliche Vollmacht erteilen, etwa an den Verwalter, Mitbewohner oder einen anderen Eigentümer. Die Gemeinschaftsordnung kann einschränken, wer als Bevollmächtigter auftreten darf.

**Protokoll: Das wichtige Dokument**
Der Verwalter erstellt ein Protokoll aller Beschlüsse (Beschluss-Sammlung ist gesetzlich vorgeschrieben). Sie haben jederzeit Einsichtsrecht. Fehler im Protokoll sollten zeitnah gerügt werden.

**Was tun bei rechtswidrigen Beschlüssen?**
Beschlüsse, die gegen Gesetz oder Gemeinschaftsordnung verstoßen, sind nicht nichtig, sondern nur anfechtbar, und zwar innerhalb von 1 Monat nach der Beschlussfassung durch Klage beim zuständigen Amtsgericht. Danach werden sie bestandskräftig, auch wenn sie rechtswidrig waren. Handeln Sie also schnell, wenn Sie einen Beschluss für unzulässig halten.

**Vorbereitung für Eigentümer**
- Einladung und Tagesordnung genau lesen
- Jahresabrechnung und Wirtschaftsplan vor der Versammlung prüfen (Belege beim Verwalter einsehen)
- Offene Fragen schriftlich vorbereiten
- Bei Verhinderung: Vollmacht rechtzeitig erteilen
- Ergebnisse und Protokoll nach der Versammlung auf Korrektheit prüfen`,
    readTime: '8 min',
    icon: '🤝'
  }
];

const categories = ['Alle', 'Kauf & Finanzierung', 'WEG & Recht', 'Verwaltung', 'Investment', 'Mietrecht', 'Energie & Sanierung'];

const Ratgeber = () => {
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [openArticle, setOpenArticle] = useState<number | null>(null);

  const filtered = activeCategory === 'Alle' ? articles : articles.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Expertenwissen</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">Immobilien-Ratgeber</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">
            Praxisnahe Guides zu Recht, Verwaltung, Investment und Förderungen. Fundiert, verständlich und kostenlos.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {articles.length} Artikel
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Ø 7 min Lesezeit
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Zuletzt aktualisiert: 2026
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(article => (
            <div key={article.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{article.icon}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    {article.category}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-2 leading-snug">{article.title}</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">{article.summary}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {article.readTime} Lesezeit
                  </span>
                  <button
                    onClick={() => setOpenArticle(openArticle === article.id ? null : article.id)}
                    className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    {openArticle === article.id ? 'Schließen' : 'Vollständig lesen'}
                    <svg className={`w-3 h-3 transition-transform ${openArticle === article.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {openArticle === article.id && (
                <div className="border-t border-slate-100 px-6 py-5 bg-slate-50">
                  <div className="prose prose-sm max-w-none text-slate-700 space-y-1">
                    {article.content.trim().split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-black text-slate-900 mt-5 mb-1 first:mt-0 text-sm">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('- ')) {
                        return <p key={i} className="pl-4 text-slate-600 text-sm font-medium before:content-['•'] before:mr-2 before:text-blue-500">{line.slice(2)}</p>;
                      }
                      if (line.startsWith('☐ ')) {
                        return <p key={i} className="pl-4 text-slate-600 text-sm font-medium">☐ {line.slice(2)}</p>;
                      }
                      if (line.trim() === '') return null;
                      return <p key={i} className="text-slate-600 text-sm font-medium leading-relaxed">{line}</p>;
                    })}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap gap-3">
                    <Link to="/ki-berater" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      Eddy fragen
                    </Link>
                    <span className="text-slate-200">|</span>
                    <Link to="/kreditrechner" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      Kreditrechner
                    </Link>
                    <span className="text-slate-200">|</span>
                    <Link to="/network" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Experten finden
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-10 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-3">Haben Sie konkrete Fragen?</h3>
            <p className="text-blue-100 font-medium mb-6 text-sm md:text-base">
              Eddy, unser KI-Immobilienberater, beantwortet Ihre persönlichen Fragen zu Recht, Verwaltung und Investment, rund um die Uhr und kostenlos. Für rechtliche und steuerliche Einzelfragen empfehlen wir zusätzlich einen Fachberater.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/ki-berater" className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all shadow-lg active:scale-95">
                Eddy, der KI-Berater
              </Link>
              <Link to="/network" className="px-6 py-3 bg-white/15 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/25 transition-all border border-white/30 active:scale-95">
                Experten im Netzwerk
              </Link>
              <Link to="/kreditrechner" className="px-6 py-3 bg-white/15 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/25 transition-all border border-white/30 active:scale-95">
                Kreditrechner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ratgeber;
