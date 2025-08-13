# Lastenheft: LS25 Produktions-Helper (privat)

## 1. Ziel & Nutzen
Eine **private Web-App** zur Planung und Bewertung von Produktionsketten in LS25.  
Funktionen: Waren/Preise pflegen, Produktionen/Rezepte definieren, Gebäude mit mehreren Produktionen abbilden, Auslastung (Monat/Jahr) und Nettoerlöse berechnen, TechTree-Visualisierung, flexible Mod-Erweiterbarkeit. Keine Accounts, keine externe Veröffentlichung.

## 2. Zielgruppe & Nutzung
- **Einzelnutzer (du)**, lokal oder innerhalb des Heimnetzes.
- Kein Mehrbenutzerbetrieb, keine Rechteverwaltung.

## 3. Systemkontext & Technologie
- **Frontend:** Vite + React + TypeScript.
- **Backend:** Node.js + Express.
- **Datenbank:** PostgreSQL.
- **Deployment:** Docker-Container (Backend, Frontend, DB) als **Portainer-Stack** direkt aus GitHub-Repo.  
  - **Netzwerk:** `main_proxy` (extern vorhanden).  
  - **Ports:** **nicht** öffentlich published; nur intern im `main_proxy` erreichbar (z. B. über Reverse-Proxy, wenn gebraucht).
- **Privatbetrieb:** Keine Registrierung, kein Login.

## 4. Begriffe (klar definiert)
- **Ware (Good):** z. B. Weizen, Mehl, Brot. Hat Einheit (Standard: Liter) und Preis [€/1000 L] oder [€/Einheit].
- **Preis:** vom Nutzer gepflegt; historisch optional (Versionierung nice-to-have).
- **Produktion (Recipe):** Definiert **mehrere Eingänge** → **mehrere Ausgänge** pro **Zyklus**.  
  - Parameter: *Input-Mengen pro Zyklus*, *Output-Mengen pro Zyklus*, *Zyklen pro Monat*, *Fixkosten pro Monat*, optional *variable Kosten pro Zyklus*.
- **Gebäude:** Enthält **eine oder mehrere Produktionen** (Rezepte). Hat Namen, optionale **Gebäudefixkosten/Monat**.
- **TechTree:** gerichteter Graph (Ware → Produktion → Ware), zeigt Pfade und Umwandlungsverhältnisse.

## 5. Muss-Anforderungen (Funktional)
### 5.1 Stammdaten & Mods
- **Waren CRUD:**
  - Name, Einheit, Dichte/Umrechnungsfaktor optional, **Preis** (Basis: €/1000 L), frei editierbar.
- **Produktionen CRUD:**
  - Name, Beschreibung, **mehrere Eingänge** (Ware + Menge/Zyklus), **mehrere Ausgänge** (Ware + Menge/Zyklus).
  - **Zyklen/Monat** (integer/float), **Kosten/Monat** (Fixkosten), optional **Kosten/Zyklus**.
- **Gebäude CRUD:**
  - Name, optionale **Gebäudekosten/Monat**; Zuordnung **mehrerer Produktionen**.
- **Mod-Support:** Nutzer kann **beliebige Waren & Produktionen selbst anlegen**.  
  - **Import/Export** als JSON (kompletter Datenstand).

### 5.2 Berechnungen
- **Kettenrechner („Was bekomme ich aus X?“):**
  - Eingabe: Startware + Menge (z. B. Weizen 10 000 L).  
  - Ausgabe: resultierende Mengen aller erreichbaren **Ausgangswaren entlang der Kette** (z. B. Mehl, dann Brot), inkl. **Zwischenstufen**.
  - Berücksichtigt **Ausbeuten pro Zyklus** (Input→Output) und begrenzt durch vorhandene Inputmenge.
- **Erlösrechnung (brutto/netto):**
  - **Bruttoerlös** = Σ(Endproduktmenge · Preis je Einheit).  
  - **Produktionskosten** = Σ(Fixkosten/Monat anteilig nach Laufzeit + variable Kosten/Zyklus · genutzte Zyklen) + **Gebäudekosten/Monat anteilig**.  
  - **Nettoerlös** = Bruttoerlös − Produktionskosten.
- **Auslastung / Bedarf:**
  - Für **jede Produktion**: zeige **benötigte Eingangsmengen** pro **Monat** und **Jahr**, um **100 % Auslastung** zu erreichen (auf Basis Zyklen/Monat und Input/Zyklus).  
  - Kaskadiert im **TechTree**: Für eine Zielproduktion (z. B. Brot) wird gezeigt, wie viel **aller Vorprodukte** pro Monat/Jahr nötig sind.
- **Dauer/Verarbeitungszeit:**
  - Ableitung aus **Zyklen/Monat** → **Sekunden pro Zyklus** ≈ (Monatssekunden / Zyklen/Monat).  
  - Anzeige: geschätzte **Zeit**, bis gegebene Menge vollständig verarbeitet ist (pro Stufe), inkl. Summe entlang des Pfads.

### 5.3 Visualisierung & UI
- **TechTree-Ansicht** (Graph):
  - Knoten: Waren (Kreis), Produktionen (Rechteck mit Zyklusdaten/Kosten).  
  - Kanten: Input (Waren→Produktion) / Output (Produktion→Waren) mit **Mengenverhältnissen**.  
  - Hover/Tooltip: Mengen/Zyklus, Zyklen/Monat, Kosten/Monat, Erlöse bei aktuellen Preisen.
  - **Auslastungs-Overlay:** zeigt pro Eingangsware die Menge/Monat & /Jahr für 100 % Auslastung.
- **Preisverwaltung:** schnelle Tabellenansicht, Massenbearbeitung (inline edit), Einheit [€/1000 L] standardmäßig.
- **Szenario-Rechner:**
  - Eingabe: Lagerbestände (z. B. Weizen X), **Schalter** „bis Endprodukt fortsetzen“ oder „nur nächste Stufe“.  
  - Ausgabe: Mengen je Stufe, Laufzeit, **Brutto/Nettowerte** (mit aktueller Preis- und Kostenbasis).
- **Gebäude-Detailseite:** listet alle Produktionen, Summen-Fixkosten (Gebäude + Produktionen), kombinierte Auslastung.

### 5.4 Persistenz & Import/Export
- **Datenbank:** alle Entitäten persistent.
- **JSON-Export:** vollständiger Dump (Waren, Preise, Produktionen, Gebäude).  
- **JSON-Import:** ersetzt optional vollständig oder **mergt** (IDs per UUID). Validierung & Duplikaterkennung.

## 6. Kann-Anforderungen (nice-to-have)
- Preis-Historie + Szenarien mit Datumsauswahl.
- Einheitensystem (L, kg) inkl. Umrechnung (wenn Dichten gepflegt).
- Sensitivitätsanalyse (± x % Preis → Nettoauswirkung).

## 7. Rechenregeln (präzise)
Bezeichner (pro Produktion p):
- `cycles_pm_p` = Zyklen pro Monat.  
- Für jeden Eingang `i`: `in_qty_per_cycle[i]`.  
- Für jeden Ausgang `o`: `out_qty_per_cycle[o]`.  
- `fix_cost_pm_p` = Fixkosten/Monat.  
- `var_cost_per_cycle_p` = variable Kosten/Zyklus (optional, default 0).  
- Gebäude g: `building_cost_pm_g`.

**Auslastung 100 % pro Monat:**
- Bedarf Eingang i: `needed_i_pm = in_qty_per_cycle[i] * cycles_pm_p`.
- Bedarf pro Jahr: `needed_i_py = 12 * needed_i_pm`.

**Max. verarbeitbare Menge bei Lagerbestand L_i:**
- Limitierende Zyklen: `possible_cycles = min_i ( floor( L_i / in_qty_per_cycle[i] ) )`.  
- Verarbeitungszeit (Monatssekunden ~ 30 Tage = 2 592 000 s):  
  `sec_per_cycle_p ≈ 2_592_000 / cycles_pm_p`,  
  `total_seconds = possible_cycles * sec_per_cycle_p`.

**Output-Mengen bei `possible_cycles`:**
- `produced_o = out_qty_per_cycle[o] * possible_cycles`.

**Wert & Kosten:**
- Preis einer Ware w: `price_w` [€/1000 L] → `unit_value_w = price_w / 1000` [€/L].  
- **Bruttoerlös** einer Menge M_o: `revenue_o = produced_o * unit_value_o`.  
- **Kosten** für genutzte Zyklen:  
  - Fixkosten-Anteil pro Monat **nur**, wenn in dem Monat betrieben → für Szenario auf **tatsächliche Laufzeit** anrechnen:  
    `months_used = total_seconds / 2_592_000`,  
    `fix_cost_used = fix_cost_pm_p * months_used` (anteilig über mehrere Monate).  
  - `var_cost_used = var_cost_per_cycle_p * possible_cycles`.  
  - **Gebäudeanteil**: analog `building_cost_used = building_cost_pm_g * months_used`.  
- **Netto**: `net = Σ(revenue_o) − (fix_cost_used + var_cost_used + building_cost_used)`.

**Kaskadierung über mehrere Stufen:**
- Von Startware → nächste Produktion, pro Pfad limitierender Faktor = minimaler erfüllbarer Input.  
- Bei **Verzweigungen**: Wenn eine Ware mehrere Folge-Produktionen hat, Szenario wahlweise **gleichmäßig** oder **benutzerdefiniert** splitten (MVP: eine Zielkette wählen).

## 8. Beispiel (aus der Anforderung)
- Preis: Weizen **400 €/1000 L**, Mehl **600 €/1000 L**.  
- Rezept: 1000 L Weizen → 800 L Mehl/Zyklus.  
- Zyklen/Monat: z. B. 100. Fixkosten/Monat: z. B. 2 000 €.  
- Eingabe: 10 000 L Weizen.  
- `possible_cycles = 10` → Output: 8 000 L Mehl.  
- Bruttoerlös Mehl: `8 000 * 0,6 € = 4 800 €`.  
- Kostenanteile gemäß Laufzeit (10 Zyklen / 100 Zyklen/Monat = 0,1 Monat):  
  Fixkostenanteil ≈ `200 €` (plus variable Kosten/Zyklus, falls gesetzt).  
- Netto ≈ `4 800 − Kosten`.

## 9. Nicht-funktionale Anforderungen
- **Performance:** Graph bis ~500 Knoten flüssig; CRUD-Operationen <200 ms Serverzeit.
- **Robustheit:** Validierung (keine Null/Negativmengen, Zyklen >0).  
- **Sicherheit (privat):**  
  - Keine externen APIs.  
  - Container nur im internen `main_proxy`-Netz; **keine `ports:` in Compose**, nur `expose:` falls nötig.  
  - Optionaler Reverse-Proxy (traefik/caddy) im selben Netz, **nicht Teil des MVP**.
- **UX:** Tastatur-Shortcuts zum schnellen Editieren (Tabellenpreise), Undo (Client-seitig) für Edits.
- **I18n:** Nicht erforderlich (Deutsch).

## 10. Schnittstellen (API – MVP)
`/api/goods`
- `GET /` (Liste), `POST /` (anlegen), `PUT /:id`, `DELETE /:id`  
  Felder:  
  ```json
  { "id": "uuid", "name": "string", "unit": "string", "price_per_1000": "number", "density": "number|null" }
  ```

`/api/recipes`
- `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`  
  Felder:  
  ```json
  {
    "id": "uuid",
    "name": "string",
    "inputs": [{"goodId":"uuid","qty_per_cycle":"number"}],
    "outputs":[{"goodId":"uuid","qty_per_cycle":"number"}],
    "cycles_per_month":"number",
    "fix_cost_per_month":"number",
    "var_cost_per_cycle":"number|null",
    "buildingId":"uuid|null"
  }
  ```

`/api/buildings`
- CRUD; Felder:  
  ```json
  { "id":"uuid","name":"string","fix_cost_per_month":"number|null","recipeIds":["uuid", "..."] }
  ```

`/api/graph`
- `GET /` → berechneter Graph (für TechTree).

`/api/calc`
- `POST /simulate` → Eingabe:
  ```json
  { "startGoodId":"uuid", "amount":"number", "targetRecipePath":["uuid","..."] }
  ```
  Rückgabe: Mengen/Zeiten/Erlöse/Netto.  
- `POST /capacity` → Eingabe:
  ```json
  { "recipeId":"uuid" }
  ```
  Rückgabe: Inputbedarf/Monat & Jahr.

`/api/export` & `/api/import`
- JSON Dump/Restore (mit Versionsfeld).

## 11. Datenmodell (DB grob)
```sql
-- Waren
goods(
  id uuid primary key,
  name text unique not null,
  unit text not null,
  price_per_1000 numeric not null,
  density numeric null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Produktionen
recipes(
  id uuid primary key,
  name text not null,
  cycles_per_month numeric not null,
  fix_cost_per_month numeric not null,
  var_cost_per_cycle numeric null,
  building_id uuid null references buildings(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Rezept-Eingänge
recipe_inputs(
  id uuid primary key,
  recipe_id uuid not null references recipes(id) on delete cascade,
  good_id uuid not null references goods(id),
  qty_per_cycle numeric not null
);

-- Rezept-Ausgänge
recipe_outputs(
  id uuid primary key,
  recipe_id uuid not null references recipes(id) on delete cascade,
  good_id uuid not null references goods(id),
  qty_per_cycle numeric not null
);

-- Gebäude
buildings(
  id uuid primary key,
  name text unique not null,
  fix_cost_per_month numeric null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Optionale Metadaten
app_meta(
  version text,
  created_at timestamptz default now()
);
```

## 12. Frontend-Funktionalität
- **Seitenstruktur (React/Vite/TS, passend zu deinem Standard):**
  - `/src/pages/user/dashboard` – Überblick, Quick-KPIs (Anzahl Waren, Produktionen, Summe Fixkosten).
  - `/src/pages/user/goods` – Preisverwaltung (inline edit, CSV/JSON Import optional).
  - `/src/pages/user/recipes` – Produktionen-Liste + Editor (Inputs/Outputs als dynamische Reihen).
  - `/src/pages/user/buildings` – Gebäude & Kosten.
  - `/src/pages/user/techtree` – Graph (z. B. mit React Flow).
  - `/src/pages/user/simulator` – Szenario-Rechner (Mengen rein → Werte/Zeiten raus).
  - Komponenten je Seite unter `/components`.
- **UX-Details:**
  - Formular zum **schnellen Hinzufügen** (Good + Preis in einem Schritt).
  - **Duplizieren** von Produktionen.
  - **Warnungen** bei Zyklen = 0, fehlenden Preisen, zirkulären Abhängigkeiten.

## 13. Abnahmekriterien (konkret testbar)
1. **CRUD** für Waren/Produktion/Gebäude funktioniert (Create→Read→Update→Delete) inkl. Validierung.  
2. **Rezept mit mehreren Eingängen** wird akzeptiert und im TechTree korrekt dargestellt.  
3. **Kettenrechner**: Eingabe „Weizen 10 000 L“ liefert korrekte Mehl-Menge gemäß Rezept; Nettoerlös berücksichtigt Fixkostenanteil (monatsanteilig) und variable Kosten.  
4. **Auslastung**: Für eine Produktion zeigt die App korrekte **Input-Bedarfe/Monat & Jahr**.  
5. **Verarbeitungszeit**: Anzeige `sec_per_cycle` abgeleitet aus `cycles_per_month`.  
6. **TechTree**: Graph rendert ohne Fehler, Tooltips zeigen Mengenverhältnisse; bei Änderung einer Menge aktualisieren sich Anzeigen.  
7. **Import/Export**: Export erzeugt gültige JSON; Import stellt exakt denselben Zustand wieder her.  
8. **Deployment**: Portainer Stack aus GitHub-Repo; Container im `main_proxy`; **keine** Ports published (nur interne Kommunikation).  
9. **Keine Auth**: App ist ohne Login nutzbar.  
10. **Fehlerfälle**: Feeds mit negativen/Null-Mengen werden abgewehrt; zirkuläre Rezepte melden klaren Fehler.

## 14. DevOps & Deployment-Vorgaben
- **Repo-Struktur (Beispiel):**
  ```
  /frontend  (Vite/React/TS)
  /backend   (Express/TS, zod-Validation)
  /db        (migrations via Prisma/Knex)
  docker-compose.yml
  portainer-stack.yml (für Git-URL-Deploy)
  README.md (Run/Deploy)
  ```
- **Docker/Compose Mindestanforderung:**
  - Services: `frontend`, `backend`, `db`.
  - Netzwerk: `main_proxy` (external: true).  
  - **Keine** `ports:`; stattdessen `expose:` intern (z. B. backend 3000, frontend 5173).  
  - `backend` spricht `db` über Service-Name.  
  - Healthchecks.  
  - Volumes für DB-Persistenz.
- **ENV-Beispiele:** `DATABASE_URL=postgresql://...`, `NODE_ENV=production`.
- **Seed-Daten:** Optional JSON-Seed (Weizen→Mehl→Brot Demo).

## 15. Annahmen
- Monat ≙ **30 Tage** (2 592 000 s) für Zeitumrechnung.
- Preise werden vom Nutzer gepflegt; keine Preisfeeds.
- Eine Produktionslinie arbeitet **linear** und ohne Downtime; Parallelisierung über mehrere Gebäude/Rezepte in Zukunft erweiterbar.
- Kettenrechner MVP folgt **einem** Zielpfad; Verzweigungen werden zunächst getrennt gerechnet.
- Anwendung ist **nur privat**; keine Benutzerverwaltung, keine externe Exposition der Ports (nur über internes Netzwerk/Proxy).

---

**Ende des Lastenhefts.**
