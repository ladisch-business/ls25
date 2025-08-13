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
... (gekürzt für Lesbarkeit in diesem Beispiel)
