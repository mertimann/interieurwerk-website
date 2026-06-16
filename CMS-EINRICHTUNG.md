# CMS einrichten – InterieurWERK (Schritt für Schritt)

Ziel: Der Kunde geht auf `seineseite.de/admin`, loggt sich ein, ändert Inhalte, klickt Speichern – und die Seite geht **automatisch live**.

## Wichtiger Hinweis (aktueller Stand)
Der alte „E-Mail-Einladung"-Weg (Netlify Identity / Git-Gateway) ist **abgekündigt** und für neue Seiten nicht mehr empfohlen. Wir nehmen deshalb den modernen Weg: **Sveltia CMS + GitHub**.

## Was du brauchst
- Ein **GitHub-Konto** (kostenlos) – das ist der „Lagerort" der Website.
- **Netlify** (habt ihr schon) – veröffentlicht automatisch neu.
- Optional **Cloudflare** (kostenlos) – nur falls der **Kunde selbst** sich einloggen soll.

Im Ordner liegen bereits: `index.html`, `content.json`, `bearbeiten.html`, der Ordner `admin/` (= das CMS) und `uploads/` (für hochgeladene Fotos).

---

## Schritt 1 – GitHub-Repository anlegen
1. Auf github.com einloggen → **New repository**.
2. Name z. B. `interieurwerk-website`, **Private**, anlegen.
3. Die Website-Dateien hochladen (per „Add file → Upload files" alle Dateien + den `admin`-Ordner reinziehen) und committen.

## Schritt 2 – CMS auf euer Repo zeigen lassen
In `admin/config.yml` die Zeile anpassen:
```
repo: DEIN-GITHUB-NAME/interieurwerk-website
```
→ z. B. `repo: BSM-Design/interieurwerk-website`. Speichern/committen.

## Schritt 3 – Netlify mit dem Repo verbinden
1. Netlify → **Add new site → Import an existing project → GitHub**.
2. Das Repo `interieurwerk-website` auswählen.
3. Build-Einstellungen leer lassen (es ist eine statische Seite), **Deploy**.
4. Ab jetzt: Jede Änderung im Repo → Netlify baut die Seite in ~1 Minute automatisch neu.

## Schritt 4 – Erster Test (BSM als Bearbeiter)
1. `eure-seite.netlify.app/admin/` öffnen.
2. Mit **GitHub anmelden** (am einfachsten am Anfang: Login per GitHub-Zugangstoken – Sveltia bietet das direkt an).
3. „Inhalte der Website" öffnen → etwas ändern, z. B. Öffnungszeiten oder ein Galerie-Foto hochladen → **Speichern/Veröffentlichen**.
4. Kurz warten → die Live-Seite ist aktualisiert. Fertig – der Kreislauf läuft.

## Schritt 5 (optional) – Kunden-Selbstbedienung
Damit sich der **Kunde** einloggen kann, gibt es heute zwei saubere Wege:

- **GitHub-Login per Cloudflare-Worker (OAuth):** kostenloser Worker (`sveltia-cms-auth`) einrichten, seine URL als `base_url` in `config.yml` eintragen, den Kunden als Mitarbeiter ins Repo einladen. Der Kunde meldet sich dann mit einem (kostenlosen) GitHub-Konto an.
- **DecapBridge** (E-Mail-Login, ohne GitHub-Konto für den Kunden): kostenloser Dienst, der die Anmeldung per E-Mail übernimmt – am nächsten an der alten, einfachen Variante. (Dann nutzt man Decap CMS statt Sveltia – gleiche Konfiguration.)

Für den **Pilot/Start** empfehle ich: erst Schritt 1–4 mit **BSM-Login** durchspielen (kein Kundenkonto nötig), den ganzen Ablauf einmal live sehen – danach in Ruhe den Kunden-Login (Schritt 5) dazunehmen.

## Gut zu wissen
- Fotos, die der Kunde im CMS hochlädt, werden als **echte Dateien** im Ordner `uploads/` gespeichert (nicht eingebettet) – schlank und schnell.
- Alles (GitHub, Netlify-Basis, Sveltia, Cloudflare-Worker) ist im Rahmen **kostenlos**.
- `bearbeiten.html` (der lokale Editor) bleibt zusätzlich nutzbar – z. B. zum Vorzeigen ohne Login.
