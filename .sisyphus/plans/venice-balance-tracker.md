# Venice API Balance Tracker

## Context

### Original Request
Der User moechte eine Single Page App bauen, um das Guthaben (USD, DIEM, VCU) von mehreren Venice AI API Keys zu ueberwachen. Die App soll auf einem VPS via Docker deploybar sein.

### Interview Summary
**Key Discussions**:
- **Multi-Key Support**: Beliebig viele API Keys mit Plus-Button hinzufuegen
- **Key-Labels**: Jeder Key bekommt einen Namen (z.B. "Privat", "Arbeit")
- **Key-Management**: Bearbeiten und Loeschen moeglich
- **Speicherung**: Local Storage (keine Datenbank)
- **Auto-Refresh**: Alle 60 Sekunden wenn Tab aktiv
- **Manueller Refresh**: Button zum sofortigen Aktualisieren
- **Deployment**: Docker-Container fuer VPS

**Research Findings**:
- Venice API liefert Balance in Response Headers bei JEDEM authentifizierten Call
- Headers: `x-venice-balance-usd`, `x-venice-balance-diem`, `x-venice-balance-vcu`
- CORS: `Access-Control-Allow-Origin: *` - Browser-Calls funktionieren direkt!
- Kein Backend-Proxy noetig

### Metis Review
**Identified Gaps** (addressed):
- **CORS-Risiko**: Validiert - funktioniert mit `*`
- **Security LocalStorage**: Akzeptabel fuer persoenliches Tool, Warnung in README
- **Rate Limiting**: Requests werden sequentiell mit kleinem Delay ausgefuehrt
- **Edge Cases**: Error States fuer invalid key, network error, rate limit

---

## Work Objectives

### Core Objective
Eine React SPA zum Ueberwachen der Guthaben (USD, DIEM, VCU) von mehreren Venice AI API Keys mit Auto-Refresh und Docker-Deployment.

### Concrete Deliverables
- React + Vite Projekt mit Tailwind CSS
- Funktionale Key-Verwaltung (hinzufuegen, bearbeiten, loeschen)
- Balance-Anzeige pro Key (USD, DIEM, VCU)
- Auto-Refresh alle 60 Sekunden
- Dockerfile fuer Production-Deployment
- README mit Setup-Anleitung

### Definition of Done
- [ ] `npm run build` laeuft ohne Fehler
- [ ] Docker-Image baut erfolgreich
- [ ] App zeigt Balance nach Key-Eingabe korrekt an
- [ ] Keys persistieren nach Page Reload

### Must Have
- Multi-Key Support mit Labels
- Balance-Anzeige (USD, DIEM, VCU)
- Local Storage Persistenz
- Auto-Refresh (60s)
- Manueller Refresh Button
- Edit/Delete fuer Keys
- Docker-Deployment
- Error States (invalid key, network error)

### Must NOT Have (Guardrails)
- KEIN Backend/Server (nur statische Files via nginx)
- KEINE Datenbank
- KEINE User-Accounts/Authentication
- KEINE Balance-Historie oder Charts
- KEINE Notifications/Alerts
- KEINE TypeScript (plain JavaScript)
- KEINE UI-Component-Library (nur Tailwind)
- KEINE State-Management-Library (nur useState/useEffect)
- MAX 5 React Komponenten
- MAX 2 Custom Hooks

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (neues Projekt)
- **User wants tests**: NO (manuelle Verifikation)
- **Framework**: none

### Manual QA Approach

Jeder TODO beinhaltet detaillierte manuelle Verifikationsschritte:
- **Frontend/UI**: Playwright Browser Automation
- **API Calls**: Browser DevTools Network Tab
- **Local Storage**: Browser DevTools Application Tab

---

## Task Flow

```
Task 0 (Project Setup)
    |
    v
Task 1 (useLocalStorage Hook)
    |
    v
Task 2 (useInterval Hook)
    |
    v
Task 3 (API Fetch Logic)
    |
    v
Task 4 (KeyCard Component) --+
    |                        |
    v                        v
Task 5 (KeyForm Component)   (parallel moeglich)
    |
    v
Task 6 (App Integration)
    |
    v
Task 7 (Styling & Polish)
    |
    v
Task 8 (Docker Setup)
    |
    v
Task 9 (README)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 4, 5 | Unabhaengige Komponenten |

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | 0 | Braucht Projekt-Struktur |
| 2 | 0 | Braucht Projekt-Struktur |
| 3 | 0 | Braucht Projekt-Struktur |
| 4 | 3 | Nutzt API Fetch Logic |
| 5 | 1 | Nutzt useLocalStorage |
| 6 | 1, 2, 3, 4, 5 | Integriert alle Teile |
| 7 | 6 | Braucht funktionierende App |
| 8 | 7 | Braucht fertige App |
| 9 | 8 | Dokumentiert fertiges Projekt |

---

## TODOs

- [x] 0. Project Setup mit Vite + React + Tailwind

  **What to do**:
  - Vite React Projekt erstellen: `npm create vite@latest . -- --template react`
  - Tailwind CSS installieren: `npm install tailwindcss @tailwindcss/vite`
  - Vite Config fuer Tailwind anpassen
  - CSS Import in main.jsx hinzufuegen
  - Unnoetige Boilerplate-Dateien entfernen (App.css, assets/)

  **Must NOT do**:
  - KEIN TypeScript Template verwenden
  - KEINE zusaetzlichen Dependencies installieren

  **Parallelizable**: NO (Basis fuer alles)

  **References**:

  **External References**:
  - Vite React Template: https://vite.dev/guide/#scaffolding-your-first-vite-project
  - Tailwind v4 mit Vite: https://tailwindcss.com/docs/installation/using-vite

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] `npm run dev` startet Development Server ohne Fehler
  - [ ] Browser zeigt "Hello World" oder leere Seite (keine Errors in Console)
  - [ ] Tailwind Klassen funktionieren (z.B. `className="text-red-500"` zeigt roten Text)

  **Commit**: YES
  - Message: `feat: initialize vite react project with tailwind`
  - Files: `package.json, vite.config.js, src/*, index.html, tailwind.config.js`

---

- [x] 1. useLocalStorage Custom Hook

  **What to do**:
  - Hook erstellen in `src/hooks/useLocalStorage.js`
  - State mit localStorage synchronisieren
  - JSON parse/stringify fuer komplexe Objekte
  - Fallback auf initialValue wenn localStorage leer

  **Must NOT do**:
  - KEINE Verschluesselung der Keys (akzeptiertes Risiko)
  - KEINE IndexedDB oder andere Storage APIs

  **Parallelizable**: YES (mit 2, 3)

  **References**:

  **Pattern References**:
  - Standard useLocalStorage Pattern: https://usehooks.com/uselocalstorage

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] In Browser Console: Hook importieren und testen
    ```javascript
    // In React Component oder Console:
    const [value, setValue] = useLocalStorage('test-key', []);
    setValue([{id: 1, name: 'test'}]);
    // Page Reload
    // value sollte [{id: 1, name: 'test'}] sein
    ```
  - [ ] DevTools > Application > Local Storage zeigt `test-key` mit JSON

  **Commit**: YES
  - Message: `feat: add useLocalStorage hook for persisting keys`
  - Files: `src/hooks/useLocalStorage.js`

---

- [x] 2. useInterval Custom Hook

  **What to do**:
  - Hook erstellen in `src/hooks/useInterval.js`
  - setInterval wrapper mit cleanup
  - Delay kann null sein um Interval zu pausieren
  - Callback Ref Pattern fuer stabile Referenz

  **Must NOT do**:
  - KEINE komplexe Scheduling-Logik
  - KEIN Web Worker

  **Parallelizable**: YES (mit 1, 3)

  **References**:

  **Pattern References**:
  - Dan Abramov useInterval: https://overreacted.io/making-setinterval-declarative-with-react-hooks/

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] Test-Component mit Counter:
    ```jsx
    const [count, setCount] = useState(0);
    useInterval(() => setCount(c => c + 1), 1000);
    // Counter sollte jede Sekunde hochzaehlen
    ```
  - [ ] Bei `delay={null}` stoppt der Counter

  **Commit**: YES
  - Message: `feat: add useInterval hook for auto-refresh`
  - Files: `src/hooks/useInterval.js`

---

- [x] 3. Venice API Fetch Logic

  **What to do**:
  - Funktion erstellen in `src/api/venice.js`
  - `fetchBalance(apiKey)` - ruft `/models` Endpoint auf
  - Extrahiert Balance aus Response Headers
  - Gibt Objekt zurueck: `{ usd, diem, vcu, error }`
  - Error Handling fuer: network error, 401 (invalid key), rate limit

  **Must NOT do**:
  - KEINE axios oder fetch wrapper Library
  - KEIN Caching (jeder Call ist frisch)

  **Parallelizable**: YES (mit 1, 2)

  **References**:

  **API References**:
  - Venice API Docs: https://docs.venice.ai/api-reference/api-spec
  - Endpoint: `GET https://api.venice.ai/api/v1/models`
  - Auth Header: `Authorization: Bearer {API_KEY}`
  - Balance Headers:
    - `x-venice-balance-usd`
    - `x-venice-balance-diem`
    - `x-venice-balance-vcu`

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] Mit gueltigem API Key:
    ```javascript
    const result = await fetchBalance('sk-...');
    console.log(result);
    // { usd: "10.50", diem: "1000", vcu: "500", error: null }
    ```
  - [ ] Mit ungueltigem API Key:
    ```javascript
    const result = await fetchBalance('invalid-key');
    console.log(result);
    // { usd: null, diem: null, vcu: null, error: "Invalid API Key" }
    ```
  - [ ] DevTools Network Tab zeigt Request mit 200 Status

  **Commit**: YES
  - Message: `feat: add venice api fetch function for balance retrieval`
  - Files: `src/api/venice.js`

---

- [x] 4. KeyCard Component

  **What to do**:
  - Component erstellen in `src/components/KeyCard.jsx`
  - Props: `{ keyData, onEdit, onDelete, onRefresh }`
  - Zeigt: Label, maskierten Key (sk-...xxx), USD, DIEM, VCU
  - Buttons: Edit, Delete, Refresh (einzeln)
  - Loading State waehrend Refresh
  - Error State wenn Balance-Fetch fehlschlaegt
  - Last Updated Timestamp

  **Must NOT do**:
  - KEINE Animation Libraries
  - KEINE Tooltip Libraries

  **Parallelizable**: YES (mit 5)

  **References**:

  **Pattern References**:
  - Tailwind Card Pattern: Utility classes fuer Card-Layout

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] Playwright Browser:
    - KeyCard wird gerendert mit allen Feldern
    - Edit Button oeffnet Edit-Modus (oder Modal)
    - Delete Button entfernt Card (nach Bestaetigung oder direkt)
    - Refresh Button zeigt Loading, dann aktualisierte Balance
  - [ ] Bei Error: Roter Text "Error: [message]"
  - [ ] Maskierter Key zeigt nur erste 3 und letzte 3 Zeichen

  **Commit**: YES
  - Message: `feat: add KeyCard component for displaying api key balance`
  - Files: `src/components/KeyCard.jsx`

---

- [x] 5. KeyForm Component

  **What to do**:
  - Component erstellen in `src/components/KeyForm.jsx`
  - Props: `{ onSubmit, initialData, onCancel }`
  - Felder: Label (text), API Key (password/text toggle)
  - Validierung: Beide Felder required
  - Submit Button: "Add Key" oder "Save Changes"
  - Cancel Button wenn im Edit-Modus

  **Must NOT do**:
  - KEINE Form Library (react-hook-form, formik)
  - KEINE API Key Format-Validierung (Trust API Response)

  **Parallelizable**: YES (mit 4)

  **References**:

  **Pattern References**:
  - Tailwind Form Styling: Input, Button Utility Classes

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] Playwright Browser:
    - Formular rendert mit Label und API Key Feldern
    - Submit ohne Eingabe zeigt Validierungsfehler
    - Submit mit Eingabe ruft onSubmit mit `{ label, apiKey }` auf
    - API Key Feld hat Show/Hide Toggle
  - [ ] Im Edit-Modus: Felder sind vorausgefuellt

  **Commit**: YES
  - Message: `feat: add KeyForm component for adding and editing keys`
  - Files: `src/components/KeyForm.jsx`

---

- [x] 6. App Integration

  **What to do**:
  - `src/App.jsx` komplett implementieren
  - State: keys (aus useLocalStorage), isRefreshing, showForm, editingKey
  - Funktionen: addKey, updateKey, deleteKey, refreshAll, refreshSingle
  - Auto-Refresh mit useInterval (60000ms)
  - Layout: Header mit Title + Refresh All Button, Key List, Add Button
  - Empty State wenn keine Keys vorhanden

  **Must NOT do**:
  - KEINE React Context (props drilling ist OK bei 2 Ebenen)
  - KEINE Route/Navigation

  **Parallelizable**: NO (integriert alles)

  **References**:

  **Component References**:
  - `src/hooks/useLocalStorage.js` - Keys persistieren
  - `src/hooks/useInterval.js` - Auto-Refresh
  - `src/api/venice.js` - Balance fetchen
  - `src/components/KeyCard.jsx` - Key anzeigen
  - `src/components/KeyForm.jsx` - Key hinzufuegen/bearbeiten

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] Playwright Browser:
    1. Leere App zeigt "No API keys yet. Add one to get started."
    2. Click "Add Key" -> Formular erscheint
    3. Label + API Key eingeben -> Submit
    4. KeyCard erscheint mit Balance (oder Error wenn ungueltig)
    5. Page Reload -> Key ist noch da (LocalStorage)
    6. 60 Sekunden warten -> Balance aktualisiert automatisch
    7. Click Edit -> Formular mit Daten erscheint
    8. Click Delete -> Key verschwindet

  **Commit**: YES
  - Message: `feat: integrate all components in main app`
  - Files: `src/App.jsx`

---

- [ ] 7. Styling & Polish

  **What to do**:
  - Dark Theme als Default (Tailwind dark classes)
  - Responsive Layout (Mobile-first)
  - Loading Spinner Component (einfache CSS Animation)
  - Saubere Abstände und Typography
  - Favicon hinzufuegen

  **Must NOT do**:
  - KEINE Animation Libraries
  - KEIN Dark/Light Toggle (nur Dark)

  **Parallelizable**: NO (braucht funktionierende App)

  **References**:

  **External References**:
  - Tailwind Dark Mode: https://tailwindcss.com/docs/dark-mode

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] Playwright Browser:
    - App hat dunklen Hintergrund
    - Text ist gut lesbar
    - Buttons haben Hover-States
    - Mobile View (375px) sieht gut aus
    - Desktop View (1920px) sieht gut aus
  - [ ] Screenshot zur Dokumentation speichern

  **Commit**: YES
  - Message: `style: add dark theme and responsive layout`
  - Files: `src/App.jsx, src/components/*, src/index.css`

---

- [ ] 8. Docker Setup

  **What to do**:
  - `Dockerfile` erstellen (Multi-Stage Build)
  - Stage 1: Node Alpine - npm install, npm run build
  - Stage 2: Nginx Alpine - serve static files
  - `nginx.conf` mit Security Headers
  - `.dockerignore` fuer node_modules, .git

  **Must NOT do**:
  - KEIN docker-compose (nicht noetig fuer SPA)
  - KEINE SSL Config (VPS Reverse Proxy macht das)

  **Parallelizable**: NO (braucht fertige App)

  **References**:

  **External References**:
  - Multi-Stage Docker Build: https://docs.docker.com/build/building/multi-stage/
  - Nginx Alpine Image: https://hub.docker.com/_/nginx

  **Nginx Security Headers**:
  ```nginx
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  ```

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] Terminal:
    ```bash
    docker build -t venice-tracker .
    # Build sollte erfolgreich sein, Image < 50MB
    
    docker run -p 8080:80 venice-tracker
    # Container startet
    ```
  - [ ] Browser: `http://localhost:8080` zeigt App
  - [ ] `docker images | grep venice-tracker` zeigt Image-Groesse

  **Commit**: YES
  - Message: `feat: add dockerfile for production deployment`
  - Files: `Dockerfile, nginx.conf, .dockerignore`

---

- [ ] 9. README Documentation

  **What to do**:
  - `README.md` erstellen
  - Projekt-Beschreibung
  - Features Liste
  - Quick Start (Development)
  - Docker Deployment Anleitung
  - Security Warning (LocalStorage API Keys)
  - Environment Variables (falls noetig)

  **Must NOT do**:
  - KEINE ausfuehrliche API Dokumentation
  - KEINE Contributing Guidelines

  **Parallelizable**: NO (letzter Schritt)

  **References**:

  **Content Requirements**:
  - Titel: Venice API Balance Tracker
  - Beschreibung: Was macht die App?
  - Quick Start: npm install, npm run dev
  - Docker: docker build, docker run
  - Security: Warnung zu LocalStorage

  **Acceptance Criteria**:

  **Manual Execution Verification**:
  - [ ] README existiert und ist lesbar
  - [ ] Commands aus README funktionieren:
    ```bash
    npm install
    npm run dev
    # App startet
    
    docker build -t venice-tracker .
    docker run -p 8080:80 venice-tracker
    # Container laeuft
    ```

  **Commit**: YES
  - Message: `docs: add readme with setup and deployment instructions`
  - Files: `README.md`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `feat: initialize vite react project with tailwind` | package.json, vite.config.js, src/*, index.html | `npm run dev` |
| 1 | `feat: add useLocalStorage hook for persisting keys` | src/hooks/useLocalStorage.js | Manual test |
| 2 | `feat: add useInterval hook for auto-refresh` | src/hooks/useInterval.js | Manual test |
| 3 | `feat: add venice api fetch function for balance retrieval` | src/api/venice.js | Manual test |
| 4 | `feat: add KeyCard component for displaying api key balance` | src/components/KeyCard.jsx | Visual check |
| 5 | `feat: add KeyForm component for adding and editing keys` | src/components/KeyForm.jsx | Visual check |
| 6 | `feat: integrate all components in main app` | src/App.jsx | Full flow test |
| 7 | `style: add dark theme and responsive layout` | src/*.jsx, src/index.css | Visual check |
| 8 | `feat: add dockerfile for production deployment` | Dockerfile, nginx.conf, .dockerignore | `docker build` |
| 9 | `docs: add readme with setup and deployment instructions` | README.md | Read through |

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: Build successful, dist/ created
docker build -t vt .   # Expected: Image built, < 50MB
docker run -p 8080:80 vt  # Expected: App accessible at localhost:8080
```

### Final Checklist
- [ ] All "Must Have" features implemented
- [ ] All "Must NOT Have" constraints respected
- [ ] App works in Chrome, Firefox, Safari
- [ ] Docker image builds and runs
- [ ] README contains all setup instructions
- [ ] Security warning in README about LocalStorage
