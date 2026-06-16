# InterieurWERK – editierbare Website + Inhalte-Editor

Das Original-Design, jetzt mit zentraler Inhaltsverwaltung. Der Kunde ändert seine Inhalte selbst – inкl. eigener Fotos.

## Dateien
- **index.html** – die fertige Website (echtes InterieurWERK-Design).
- **bearbeiten.html** – der Editor: links ändern, rechts Live-Vorschau der echten Seite.
- **content.json** – hier liegen alle änderbaren Inhalte.

Die drei Dateien gehören in **einen** Ordner.

## So testest du es
1. **bearbeiten.html** im Browser öffnen.
2. Links etwas ändern → rechts ändert sich die Seite **sofort**.
3. **Speichern** merkt sich die Änderungen. **content.json herunterladen** = Datei zum Veröffentlichen.

## Was editierbar ist
- **Startseite:** Obertitel, Unterzeile, **Hauptbild** (auch vom Computer hochladen)
- **Kontakt:** Telefon, E-Mail, Adresse, Öffnungszeiten (Mo–Fr & Sa), Kontakt-Intro – wird an **allen** Stellen gleichzeitig aktualisiert
- **Texte:** Über uns (Fußzeile), Abschluss-Aufruf
- **Galerie je Sparte:** Fotos **vom Computer hochladen** oder aus Vorlagen wählen, einer **Sparte** zuordnen (Fliesen, Naturstein, Parkett, Bäder, Showroom, Sonstiges), Reihenfolge beliebig erweitern, einzeln entfernen

## Fotos hochladen
„＋ Foto hochladen" (Galerie) bzw. „Hochladen" (Hauptbild) wählt eine Bilddatei vom Computer. Das Bild wird automatisch verkleinert und direkt in die Vorschau übernommen.

## „Live für alle Besucher" – der nächste Schritt
Aktuell wird lokal gespeichert (Vorschau + content.json zum Download). Für „Speichern → automatisch live" verbinden wir wie besprochen entweder ein **CMS (Selbstbedienung, Login auf /admin)** oder **BSM veröffentlicht** (Pflege-Paket).

## Hinweise
- Für die volle Funktion am besten **gehostet** (per Internet) testen. Lokal läuft die Live-Vorschau ebenfalls.
- Hochgeladene Fotos werden für die lokale Vorschau direkt eingebettet. Bei sehr vielen großen Fotos kann der lokale Speicher knapp werden – fürs Veröffentlichen zählt die heruntergeladene `content.json` (im echten Betrieb mit CMS/Hosting werden Fotos als echte Dateien gespeichert).
