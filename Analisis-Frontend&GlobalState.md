# Frontend Architecture Audit — MiSecundaria 7

> **Scope:** `frontend/src/services/api.js`, `frontend/src/context/DataContext.jsx`, and state-based navigation across all 6 Dashboard components.
>
> **Estado:** Análisis de código estático. Ejecución de correcciones y de instrumentación de debugging pendiente de las reglas pre-ejecución.

---

## ⚠ Reglas Obligatorias Pre-Ejecución

> **Autoridad:** Este documento está estrictamente subordinado a [`Modification-Flow&CodebaseRules.md`](Modification-Flow%26CodebaseRules.md).
> Ningún comando de auditoría mutante, instrumentación de debugging ni corrección derivada de este documento se ejecuta sin cumplir previamente con estas directivas:

1. **Clasificación de comandos:**
   - **Comandos de Solo Lectura (Auditoría):** Se pueden ejecutar directamente para recolectar información (`rg` sobre `api.js` / `DataContext.jsx` / dashboards, inspección de `package.json`, lectura de tests existentes).
   - **Comandos Mutantes (Modificación de datos o código):** Requieren seguir estrictamente el **Flujo CLI Obligatorio (Fases 0 a 6)** de `Modification-Flow&CodebaseRules.md` antes de ejecutarse. Incluye: editar `api.js`, `DataContext.jsx`, dashboards, inyectar loggers de navegación, overlays de debug, `history.pushState`, o cualquier corrección de hallazgos.
2. **Búsqueda Global previa a cambios (Fase 1):** Antes de modificar cualquier símbolo identificado en este análisis (`API_BASE`, `createActaCurso`, `createActaAlumno`, `fetchData`, `refreshData`, `view`, `seccionActiva`, funciones de `api.js`), ejecutar `rg --no-heading --line-number -w "${TARGET_FIELD}"` en todo el repositorio.
3. **Cadena de Dependencias (Fase 2) y Referencia Cruzada (Fase 3):** Un cambio en `api.js` obliga a revisar consumidores en `DataContext.jsx` y en todos los JSX. Un cambio de nombre de campo o endpoint obliga a verificar coherencia serializer ↔ `api.js` ↔ componente (tabla de símbolos críticos §2).
4. **Validación de idioma español (§3.4):** Toda corrección frontend debe respetar el checklist FE-1 a FE-9. Nombres de funciones en `api.js` en camelCase español; componentes PascalCase en español; strings de UI en español. Excepciones (`loading`, `error`, `success`, `Dashboard`) solo las de §3.5, o registradas en `DECISIONES.md` (§7) **antes** de implementarlas.
5. **Tests y verificación (Fases 5 y 6):** Forma canónica frontend: `cd frontend && npx vitest run`. Si hay tests fallidos, **DETENERSE**. Tras modificar: re-ejecutar Fase 1 con el símbolo nuevo, confirmar que no quedan residuos del símbolo viejo, `cd frontend && npx vite build`, y re-ejecutar tests.

| Sección del Documento | Tipo de Operación | Requisito Previo |
|-----------------------|-------------------|------------------|
| §1 Checklist `api.js` (lectura de código) | Solo Lectura (Read-Only) | Ninguno (seguro para auditar) |
| §2 Checklist `DataContext.jsx` (lectura de código) | Solo Lectura (Read-Only) | Ninguno (seguro para auditar) |
| §3.1–§3.2 Arquitectura y issues conocidos | Solo Lectura (Read-Only) | Ninguno |
| §3.3 Strategy 2 — React DevTools | Solo Lectura (inspección) | Ninguno |
| §3.3 Strategy 1 — Navigation Event Logger | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6** (edita dashboards) |
| §3.3 Strategy 3 — Visual State Overlay | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6** (inyecta JSX) |
| §3.3 Strategy 4 — Simulated URL Sync | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6** (nuevo hook + 6 dashboards) |
| §3.3 Strategy 5 — Tests de navegación | Ejecución de verificación | Forma canónica: `cd frontend && npx vitest run` |
| Correcciones derivadas de hallazgos (`API_BASE`, race 401, duplicados, over-fetch, `value` memoizado, etc.) | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6 + Checklist Español §3.4 + Cross-ref Fase 3** |

**Símbolos de alto impacto en este documento** (usar Fase 0 + tabla §2 antes de tocarlos):

| Símbolo | Origen | Dependencias típicas |
|---------|--------|----------------------|
| `API_BASE` / `baseURL` | `api.js` | Todas las funciones HTTP, interceptor de refresh, `.env.example` frontend |
| `createActaCurso` / `createActaAlumno` | `api.js` | Componentes de actas, `DataContext.jsx` |
| `login` / `logout` / `getMe` | `api.js` | `AuthContext.jsx`, `Login/login.jsx` |
| `fetchData` / `refreshData` | `DataContext.jsx` | Todos los dashboards y componentes CRUD |
| `view` / `setView` | Dashboards | `sidebarMenu.js` de cada rol, `setView` pasado como prop |
| `seccionActiva` | `PanelProfesores.jsx` | Sidebar docente, ternarios de render |

---

## 1. `api.js` — HTTP & JWT Interceptor Audit Checklist

**File:** `frontend/src/services/api.js` (685 lines, ~90+ exported endpoint functions)

### 1.1 Instance Configuration

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | `baseURL` uses environment variable | **FAIL** | Hardcoded to `http://localhost:8000/api` (line 3). Will break in any non-local deployment. |
| 2 | Default `Content-Type` header set | **OK** | `'application/json'` applied at creation (line 7). |
| 3 | Request timeout configured | **FAIL** | No `timeout` property on `axios.create()`. Requests can hang indefinitely. |
| 4 | `withCredentials` configured if needed | N/A | Not required for JWT-in-header pattern. |

### 1.2 Request Interceptor — JWT Injection

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 5 | Token read from consistent storage key | **OK** | Reads `access_token` from `localStorage` (line 11). |
| 6 | `Authorization: Bearer <token>` header set correctly | **OK** | Line 13. |
| 7 | `FormData` detection strips `Content-Type` | **OK** | Lines 15–18. Both `FormData` instance check and lowercase header removal handled. |
| 8 | Token absence does not set empty header | **OK** | Conditional `if (token)` prevents `Bearer undefined`. |

### 1.3 Response Interceptor — 401 Handling & Token Refresh

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 9 | Refresh only triggers on first 401 | **PARTIAL** | `original._retry` flag (line 26) prevents infinite loops, but... |
| 10 | Concurrent 401 race condition protected | **FAIL** | No mutex/queue. If 3 requests fail simultaneously, all 3 fire separate `POST /token/refresh/` calls before the first writes the new token. |
| 11 | Refresh uses raw `axios` (bypassing interceptor) | **OK** | Line 31 uses bare `axios.post`, not `api.post`, avoiding recursive interceptor calls. |
| 12 | New `access_token` persisted and retried | **OK** | Lines 34–36: stores new token, patches original request header, returns `api(original)`. |
| 13 | On refresh failure: tokens cleared | **OK** | Lines 38–39: both `access_token` and `refresh_token` removed from `localStorage`. |
| 14 | On refresh failure: user redirected to login | **PARTIAL** | Uses `window.location.reload()` (line 40). This re-mounts the app and re-runs `AuthContext` init, which will detect missing token and show login. Functional but crude — no programmatic navigation. |
| 15 | Refresh token expiration handled | **FAIL** | If the refresh token itself is expired (401 on `/token/refresh/`), the `catch` block runs the same `reload()` path. The server error response is discarded with no user feedback. |

### 1.4 Token Lifecycle (`login` / `logout`)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 16 | `login()` stores both tokens | **OK** | Lines 50–51. |
| 17 | `logout()` clears both tokens | **OK** | Lines 57–58. |
| 18 | `logout()` does not call API server-side logout | **FAIL** | Tokens remain valid server-side until expiration. No `/logout/` or token-blacklist call. |
| 19 | `getMe()` used for session validation | **OK** | Called from `AuthContext` on mount to verify token validity. |

### 1.5 Code Quality & Maintainability

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 20 | Functions are grouped by domain | **PARTIAL** | Loosely grouped (alumnos, docentes, etc.) but no clear section markers beyond the `--- Sistema Académico Avanzado ---` comment. |
| 21 | No duplicate endpoint definitions | **FAIL** | `createActaCurso` appears at line 489 (already defined at line 271). `createActaAlumno` appears at line 494 (already at line 277). |
| 22 | No TypeScript/prop validation | **FAIL** | Pure JS. No parameter type checks. Incorrect param types will silently pass to axios and fail at runtime. |
| 23 | Error handling is uniform | **FAIL** | No centralized error transformation. Each consumer must handle raw axios errors independently. |
| 24 | No request cancellation support | **FAIL** | No `AbortController` or signal forwarding. Components that unmount mid-request risk state updates on unmounted components. |
| 25 | `FormData` header stripping is robust | **OK** | Both `Content-Type` and `content-type` variants are deleted. |

### 1.6 Security Concerns

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 26 | Tokens stored in `localStorage` | **WARNING** | Accessible to any JS on the page (XSS vector). `httpOnly` cookies are preferred for refresh tokens. |
| 27 | No CSRF protection | **N/A** | Bearer-token pattern does not use cookies, so CSRF is not applicable. |
| 28 | API base URL not hardcoded in interceptor calls | **OK** | Refresh call uses `API_BASE` constant (line 31). |

---

## 2. `DataContext.jsx` — Parallel Loading & Global State Audit Checklist

**File:** `frontend/src/context/DataContext.jsx` (716 lines)

### 2.1 Data Fetching Strategy

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | All endpoints fetched in parallel | **OK** | Single `Promise.all` with 23 calls (lines 114–141). No sequential waterfalls. |
| 2 | Individual errors don't block others | **OK** | Each call has `.catch(() => [])`, so a failing endpoint returns an empty array. |
| 3 | Errors are surfaced to the user | **FAIL** | Caught errors are silently replaced with `[]`. Only `getCursoMateria` logs to console (line 121). The `error` state is only set if the outer `try/catch` fires, which it won't since individual calls swallow errors. |
| 4 | Loading state differentiates initial vs. refresh | **OK** | `hasLoadedRef` (line 79) distinguishes `loading` (initial) from `refreshing` (subsequent). |
| 5 | Fetch runs on mount only | **OK** | `useEffect` with `[fetchData]` dependency (lines 629–631). `fetchData` is wrapped in `useCallback` with `[]` deps. |

### 2.2 Role-Based Data Segmentation

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 6 | Data filtered by active role | **FAIL** | All 23 endpoints fire for every role. An `alumno` fetches `docentes`, `preceptores`, `suplencias`, `horarios`, `horarios-especiales`, `historial`, etc. that they will never use. |
| 7 | Response payload size is reasonable | **FAIL** | Full `asistencias`, `calificaciones`, `comunicados`, `actas` for the entire school are fetched for every user. This is an O(school_size) payload for every login. |

### 2.3 Data Denormalization & Transformation

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 8 | Raw API data normalized on load | **OK** | Alumno objects remapped (lines 143–162), docente map built (lines 174–222), curso-materia joined (lines 164–172). |
| 9 | Transformation cost is acceptable | **WARNING** | ~400 lines of transformation logic runs synchronously in the main thread on every fetch. For large datasets this may cause jank. |
| 10 | Derived data is memoized | **FAIL** | All derived data (e.g., `notasDocenteAdmin`, `actasAlumno`, `comunicados`) is computed once in `fetchData` and stored in `data`. If `refreshData` is called, everything recomputes. No `useMemo` for individual derived properties. |
| 11 | IDs are consistent | **WARNING** | Multiple ID naming conventions: `id_alumno`, `id_docente`, `id_preceptor`, `id_comunicado`. Client-side remapping (`a.id = a.id_alumno`) is done but error-prone. |

### 2.4 Context Value & Re-render Behavior

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 12 | Context value is stable (referential equality) | **FAIL** | `setData(...)` inside `fetchData` creates a new `data` object reference on every refresh. Every consumer re-renders. |
| 13 | Value object is memoized | **FAIL** | The `DataContext.Provider` `value` prop (lines 638–644) is a new object literal every render. |
| 14 | `refreshData` is stable | **PARTIAL** | `fetchData` is `useCallback`-stable, but the `data.refreshData = fetchData` mutation (line 634) is a code smell — it mutates the state object after creation. |
| 15 | Granular subscriptions possible | **FAIL** | All consumers get the full data blob. No selector pattern. Components that only need `cursos` still re-render when `notificaciones` change. |

### 2.5 `useData()` Hook Behavior

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 16 | Returns safe defaults during loading | **OK** | Lines 651–703 return 30+ empty/default properties. Prevents null-reference errors in components. |
| 17 | Loading state is communicated | **OK** | Returns `loading: true` when data isn't ready. |
| 18 | Fallback defaults are maintainable | **FAIL** | The fallback object (lines 651–703) must be manually kept in sync with the real data shape. Any new property added to `data` must also be added here. |
| 19 | Throws if used outside provider | **OK** | Line 650: `if (!ctx) throw new Error(...)`. |

### 2.6 Separate Admin Refresh Functions

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 20 | `refreshAdminCursos` works independently | **OK** | Dedicated state (`adminCursos`) and setter. |
| 21 | Separate state is consistent with global pattern | **WARNING** | `adminCursos`, `adminMaterias`, `adminCursoMateria` are separate from the global `data.cursosObj`/`data.materiasObj`. This creates two sources of truth. |

---

## 3. State-Based Navigation — Debugging & Tracing Strategies

### 3.1 Architecture Overview

This project has **no routing library** (`react-router` is not in `package.json`). Instead:

- **6 Dashboard components** each own a `const [view, setView] = useState('perfil')` state variable
- **6 sidebar menu configs** (one per role) map `item.id` strings to `setView()` calls
- **Switch statements** in each dashboard render different components based on the `view` string
- **No URL synchronization** — the browser address bar always shows `/`

#### Affected Dashboards

| Dashboard | File | View State Variable | Case Count |
|-----------|------|-------------------|------------|
| Admin | `AdminDashboard.jsx:25` | `view` | 18 cases |
| Preceptor | `PreceptorDashboard.jsx:30` | `view` | 12 cases |
| Docente | `PanelProfesores.jsx:25` | `seccionActiva` | 8+ cases |
| Familia | `FamiliaDashboard.jsx:22` | `view` | 8 cases |
| Alumno | `AlumnoDashboard.jsx:30` | `view` | 8 cases |
| Jefe Preceptores | `JefePreceptorDashboard.jsx:27` | `view` | 12 cases |

### 3.2 Known Issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | **No deep linking** | Users cannot bookmark or share a URL to a specific view. Refreshing the page resets to `'perfil'`. |
| 2 | **Back/forward navigation broken** | Browser history is not updated. Pressing "Back" exits the app instead of navigating to the previous view. |
| 3 | **No scroll restoration** | Switching views does not preserve or restore scroll position. |
| 4 | **View state not persisted** | Page refresh always starts at default view. |
| 5 | **Programmatic navigation is fragile** | Any component needing to navigate must receive `setView` as a prop. There's no central navigation API. |
| 6 | **Docente uses different variable name** | `PanelProfesores` uses `seccionActiva` instead of `view`, breaking consistency. |
| 7 | **Nested conditional rendering** | `PanelProfesores.jsx` has a ternary chain of 10+ conditions (lines 215–367), making the render logic hard to follow and debug. |

### 3.3 Debugging Strategies

> ⚠ **Las Strategies 1, 3 y 4 modifican código.** No se aplican “para ver el error”: primero Fase 0–6 de [`Modification-Flow&CodebaseRules.md`](Modification-Flow%26CodebaseRules.md) (símbolo `setView` / `seccionActiva` en los 6 dashboards). Strategy 2 es solo inspección. Strategy 5 usa `cd frontend && npx vitest run`.

#### Strategy 1: Navigation Event Logger (Non-Invasive)

Add a development-only wrapper around `setView` that logs every navigation transition:

```jsx
// In any Dashboard component, temporarily wrap setView:
const [view, _setView] = useState('perfil');
const setView = useCallback((nextView) => {
  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed(`[Nav] ${view} → ${nextView}`);
    console.trace();
    console.groupEnd();
  }
  _setView(nextView);
}, [view]);
```

This traces **every** transition with a stack trace showing which sidebar button or programmatic call triggered it.

#### Strategy 2: React DevTools State Inspection

1. Open React DevTools → Components tab
2. Find the Dashboard component (e.g., `AdminDashboard`)
3. Inspect the `view` state value in the hooks panel
4. Click sidebar items and observe state changes in real-time
5. For `PanelProfesores`, also inspect `seccionActiva`, `cursoId`, and `materiaSeleccionada` — navigation depends on all three

#### Strategy 3: Visual State Overlay (Development)

```jsx
// Render current navigation state as a debug overlay:
{process.env.NODE_ENV === 'development' && (
  <div style={{
    position: 'fixed', bottom: 0, right: 0, background: 'rgba(0,0,0,0.8)',
    color: '#0f0', padding: '8px 12px', fontSize: '11px', fontFamily: 'monospace', zIndex: 9999
  }}>
    view: {view} | anio: {anioLectivo} | curso: {curso}
  </div>
)}
```

#### Strategy 4: Simulated URL Sync (Lightweight Migration Path)

Without adopting React Router, you can add `history.pushState` to track view state:

```jsx
// Custom hook:
function useViewNavigation(defaultView) {
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || defaultView;
  });

  const navigate = useCallback((nextView) => {
    setView(nextView);
    const url = new URL(window.location);
    url.searchParams.set('view', nextView);
    window.history.pushState({}, '', url);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setView(params.get('view') || defaultView);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [defaultView]);

  return [view, navigate];
}
```

This gives you: back/forward support, shareable URLs, and page refresh persistence — without introducing a routing library.

#### Strategy 5: Automated Navigation Testing

Since there are no routes, traditional route testing doesn't apply. Instead:

1. **Test sidebar click → view state → rendered component:**
   ```jsx
   render(<AdminDashboard user={mockUser} onLogout={jest.fn()} />);
   fireEvent.click(screen.getByText('Alumnos'));
   expect(screen.getByTestId('alumnos-component')).toBeInTheDocument();
   ```

2. **Test the switch statement exhaustiveness:**
   - Ensure every `case` in each dashboard's `renderView()` maps to a valid component
   - Ensure every `sidebarMenu.js` `id` has a matching `case`

3. **Test navigation state isolation:**
   - Verify that switching roles (via `cambiarRol`) resets `view` state
   - Verify that `DataProvider` refresh does not reset `view` state

#### Strategy 6: Mapping Navigation Flow Without a Router

Create a navigation map document for each role:

```
Admin: perfil → [alumnos, docentes, preceptores, jefes-preceptores, administradores,
                  horarios, adelantos-horas, asistencias, calendario, notas, comunicados,
                  cursos, materias, suplencias, historial, actas, info, notificaciones]

Docente: docente → [alumnos, info, planif, libro-temas, actividades, asistencia,
                     actas, comunicados, materias-adeudadas, calendario, notificaciones]
  (NOTE: alumnos/info/planif/etc. require cursoId + materiaSeleccionada to be set first)
```

This reveals the **precondition dependency** problem in `PanelProfesores`: clicking "Calificaciones" when no curso/materia is selected shows an empty state instead of the view — a UX issue that routes with params could solve.

---

## Summary of Critical Findings

> ⚠ Estos hallazgos **no se corrigen al detectarlos**. Cada corrección es operación **MUTANTE** y requiere el Flujo Fases 0–6 + checklist español §3.4 de [`Modification-Flow&CodebaseRules.md`](Modification-Flow%26CodebaseRules.md) **antes** de editar `api.js`, `DataContext.jsx` o cualquier dashboard.

| Area | Severity | Finding |
|------|----------|---------|
| `api.js` | **HIGH** | Hardcoded `API_BASE` — cannot deploy to staging/production without code change |
| `api.js` | **HIGH** | Refresh token race condition — concurrent 401s cause duplicate refresh calls |
| `api.js` | **MEDIUM** | Duplicate endpoint definitions (`createActaCurso`, `createActaAlumno`) |
| `DataContext` | **HIGH** | All 23 endpoints fire for every role — massive over-fetching |
| `DataContext` | **HIGH** | Individual endpoint errors silently swallowed — users see empty states with no error message |
| `DataContext` | **MEDIUM** | Context value object recreated every render — causes unnecessary re-renders in all consumers |
| `DataContext` | **MEDIUM** | `data.refreshData = fetchData` mutates state object — code smell, potential stale closures |
| Navigation | **HIGH** | No URL sync — back/forward broken, no deep linking, no shareable URLs |
| Navigation | **MEDIUM** | Docente dashboard uses `seccionActiva` instead of `view` — inconsistent pattern |
| Navigation | **MEDIUM** | `PanelProfesores` has 10+ ternary conditions — unmaintainable render logic |
