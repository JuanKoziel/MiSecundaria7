# UI & Institutional Design Audit — Mi Secundaria 7

> **Scope:** Global CSS audit, institutional design-system compliance, and Shared-component extraction methodology for the Mi Secundaria 7 React project (Vite, vanilla CSS, no external UI frameworks).
>
> **Estado:** Análisis de código estático. Extracciones Shared, consolidación de selectores y nuevas variables CSS pendientes de las reglas pre-ejecución.

---

## ⚠ Reglas Obligatorias Pre-Ejecución

> **Autoridad:** Este documento está estrictamente subordinado a [`Modification-Flow&CodebaseRules.md`](Modification-Flow%26CodebaseRules.md).
> Ningún comando de auditoría mutante, extracción de componentes ni corrección derivada de este documento se ejecuta sin cumplir previamente con estas directivas:

1. **Clasificación de comandos:**
   - **Comandos de Solo Lectura (Auditoría):** Se pueden ejecutar directamente para recolectar información (`rg` / `grep` sobre `index.css` y JSX, scan de imports por rol, conteo de clases huérfanas, inspección de `!important`).
   - **Comandos Mutantes (Modificación de datos o código):** Requieren seguir estrictamente el **Flujo CLI Obligatorio (Fases 0 a 6)** de `Modification-Flow&CodebaseRules.md` antes de ejecutarse. Incluye: consolidar selectores duplicados, extraer variables CSS, mover componentes a `Shared/`, unificar `FiltrosAnioCurso`, extraer `StatCard` / `TablaCRUD` / `ProfileGrid`, o cualquier corrección del plan de acción.
2. **Búsqueda Global previa a cambios (Fase 1):** Antes de renombrar o extraer cualquier clase CSS, variable `--*`, o componente JSX, ejecutar `rg --no-heading --line-number -w "${TARGET_FIELD}"` en todo el repositorio (`.css`, `.jsx`, `.js`). Una clase en `index.css` puede estar referenciada en múltiples roles.
3. **Cadena de Dependencias (Fase 2):** Extraer a `Shared/` implica actualizar **todos** los imports de cada directorio de rol, borrar duplicados (nunca dejar ambas copias) y verificar que no queden dependencias circulares. Una variable CSS nueva o renombrada implica barrer `index.css` y todos los `className` / `style` en JSX.
4. **Validación de idioma español (§3.4 / FE-6 / FE-9):** Clases CSS en kebab-case español; componentes Shared en PascalCase español; carpetas de componentes en español (excepto `Shared/` y `Login/`). **Variables CSS en inglés** (`--primary-color`, `--sidebar-bg`, `--card-bg`) son excepción ya registrada en §3.5. **Cualquier variable nueva en inglés** (`--danger`, `--success`, `--secondary`, `--warning`, `--info-bg`, `--error-text`, `--label-dark`, `--placeholder`, `--bg-subtle`, `--border-light`, `--overlay-border`, `--overlay-dark`, `--radius-sm`) **debe** registrarse en `DECISIONES.md` (§7 de las reglas) **antes** de crearla, o usarse con nombre en español.
5. **Tests y verificación (Fases 5 y 6):** Forma canónica frontend: `cd frontend && npx vitest run`. Tras cambios de CSS/JSX: `cd frontend && npx vite build`. Si hay tests fallidos, **DETENERSE**. Confirmar con `rg` que no quedaron residuos del selector/componente viejo.

| Sección del Documento | Tipo de Operación | Requisito Previo |
|-----------------------|-------------------|------------------|
| Part 1 — Inventario y checklists CSS (lectura / `rg`) | Solo Lectura (Read-Only) | Ninguno (seguro para auditar) |
| Part 2 — Compliance de design system (lectura de JSX) | Solo Lectura (Read-Only) | Ninguno |
| Part 2.3 — Completar matriz por componente (solo documentar) | Solo Lectura (Read-Only) | Ninguno |
| Part 3.1–3.2 — Inventario Shared y scans de imports | Solo Lectura (Read-Only) | Ninguno |
| Part 3.3 — Extracción a `Shared/` | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6 + Checklist Español §3.4** |
| Part 3.4 — Extraer `StatCard`, unificar `FiltrosAnioCurso`, etc. | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6** (imports en 5+ paneles) |
| Part 4 — Checklist responsive (lectura) | Solo Lectura (Read-Only) | Ninguno |
| Part 5 P0 — Consolidar selectores duplicados | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6** (`.main-header`, `.card`, `.table-responsive`, `.user-avatar`) |
| Part 5 P0/P1 — Extraer variables CSS | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6 + excepción §3.5/§7 si el nombre queda en inglés** |
| Part 5 P2 — Quitar `style={{}}`, agregar `aria-*`, borrar clases huérfanas | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6** |
| Correcciones derivadas de hallazgos | **MUTANTE** ⚠ | **Requiere Flujo Fases 0–6 + Checklist Español** |

**Símbolos de alto impacto en este documento** (usar Fase 0 + tabla §2 de las reglas antes de tocarlos):

| Símbolo | Origen | Dependencias típicas |
|---------|--------|----------------------|
| `--primary-color` y resto de `:root` | `index.css` | Todo `index.css` + cualquier `style` inline en JSX |
| `.main-header` / `.card` / `.table-responsive` / `.user-avatar` | `index.css` (definiciones duplicadas) | Headers de todos los roles, layouts, tablas |
| `FiltrosAnioCurso` | `Administracion/` y `Preceptores/` | Dashboards admin y preceptor |
| `StatCard` (inline) | Cada `Panel{Rol}.jsx` | 5+ paneles |
| Clases de modal (`ddjj-modal-overlay`, `standard-modal`) | `index.css` | `FormModal.jsx` y formularios por rol |

---

## Part 1 — Global `index.css` Audit Guide

### 1.1 File Overview

| Metric | Value |
|--------|-------|
| Total lines | 3120 |
| Sections (comment-delimited) | ~18 major blocks |
| CSS variables defined in `:root` | 18 |
| Hardcoded color values (outside variables) | ~40+ |
| Responsive breakpoints | 3 (`992px`, `768px`, `480px`) |
| Duplicate selector blocks | 3 (`.main-header`, `.card`, `.table-responsive` redefined) |

### 1.2 CSS Variable Inventory

The following variables are defined in `:root` (lines 4–25):

| Variable | Value | Usage |
|----------|-------|-------|
| `--primary-color` | `#fd7e14` | Buttons, accents, focus rings |
| `--primary-dark` | `#e06d0f` | Button hover states |
| `--bg-gradient` | `linear-gradient(...)` | Body background |
| `--sidebar-color` | `#0d233a` | Sidebar bg |
| `--sidebar-hover` | `#163452` | Sidebar hover, dark form containers |
| `--text-dark` | `#333333` | Primary text |
| `--text-light` | `#666666` | Secondary text, labels |
| `--white` | `#ffffff` | Card backgrounds |
| `--shadow` | `0 4px 15px rgba(0,0,0,0.05)` | Cards, headers |
| `--radius` | `12px` | Border radius |
| `--transition` | `all 0.3s ease` | All transitions |
| `--table-header-bg` | `#17324d` | Table `<th>` background |
| `--table-header-text` | `#ffffff` | Table `<th>` text |
| `--table-border` | `#d7dee8` | Table cell borders |
| `--table-row-bg` | `#ffffff` | Table row background |
| `--table-row-alt` | `#f4f7fb` | Even row alternate |
| `--table-row-hover` | `#fff3e6` | Row hover (orange tint) |
| `--table-text` | `#27313f` | Table cell text |
| `--card-bg` | `#ffffff` | Card backgrounds |
| `--border-color` | `#dee2e6` | General borders |

### 1.3 Audit Checklist — CSS Variables

- [ ] **No duplicate variable definitions.** Verify that `:root` is the single source of truth; no other block redefines these variables.
- [ ] **All colors referenced in components use variables.** Grep for hardcoded hex/rgb values outside `:root`. Extraer variables es **MUTANTE** (Fases 0–6). Nombres nuevos en inglés requieren excepción en `DECISIONES.md` (§3.5 / §7) **antes** de crearlas. Candidatos:
  - `#dc3545` (btn-danger) → propose `--danger`
  - `#28a745` (btn-success) → propose `--success`
  - `#6c757d` (btn-secondary) → propose `--secondary`
  - `#ffc107` (btn-warning) → propose `--warning`
  - `#f0f4ff` (info-box) → propose `--info-bg`
  - `#b91c1c` (error-message) → propose `--error-text`
  - `#cbd5e1` (modal labels) → propose `--label-dark`
  - `#6b7785` (placeholder) → propose `--placeholder`
- [ ] **All spacing, radius, and shadow values use variables.** Currently `border-radius: 8px` appears 30+ times but `--radius` is `12px` — different contexts intentionally differ, but document which radius is "system-wide" vs "component-specific".
- [ ] **No stale/orphan variables.** Every variable in `:root` should be referenced at least once. Verify with `grep -c`.
- [ ] **Missing variables for repeated patterns.** The following magic numbers appear in 3+ places and should become variables:
  - `rgba(253, 126, 20, 0.10)` / `0.12` / `0.2` (focus ring tints)
  - `rgba(255, 255, 255, 0.08)` / `0.1` / `0.16` (overlay borders on dark bg)
  - `rgba(15, 23, 42, 0.62)` (modal overlay)
  - `0 24px 60px rgba(15, 23, 42, 0.25)` (modal shadow)

### 1.4 Audit Checklist — Structural Integrity

- [ ] **No duplicate selectors.** The following selectors are defined more than once with conflicting properties — this is a critical issue (last definition wins):
  - `.main-header` — defined at lines 401–410 and 1886–1895 (conflicting `padding` and `border-radius`)
  - `.card` — defined at lines 473–479 and 1921–1927 (conflicting `border-radius`)
  - `.table-responsive` — defined at lines 593–596 and 1933–1941 (second definition adds border, radius, shadow)
  - `.user-avatar` — defined at lines 422–432 and 1897–1907 (conflicting `width`/`height`)
- [ ] **No orphan classes.** Every CSS class should be referenced by at least one JSX file. Run `grep -rn 'className' src/components/ | grep -o '"[^"]*"' | sort -u` and cross-reference with CSS class definitions.
- [ ] **Section comments are sequential.** The file uses `/* === */` block headers — verify they are ordered logically (variables → resets → utilities → components → responsive).
- [ ] **No `!important` abuse.** The file contains ~5 `!important` declarations (e.g., `.sidebar-logout-btn`, `.preceptor-status-toggle`). Each must be justified.
- [ ] **No empty rule blocks.** Check for blocks with no declarations.

### 1.5 Audit Checklist — Hardcoded Values (Priority Extraction Candidates)

| Value | Occurrences | Proposed Variable |
|-------|-------------|-------------------|
| `#f8f9fa` | 15+ | `--bg-subtle` |
| `#ddd` / `#edf2f7` | 10+ | `--border-light` |
| `rgba(255,255,255,0.1)` | 8+ | `--overlay-border` |
| `#e9ecef` | 3+ | `--badge-bg` |
| `#0f172a` | 2+ | `--overlay-dark` |
| `8px` (border-radius) | 30+ | `--radius-sm` (distinct from `--radius`) |
| `0.85rem` / `0.9rem` | 20+ | `--font-size-sm` / `--font-size-base` |
| `14px` / `16px` (padding) | 25+ | `--spacing-md` / `--spacing-lg` |

---

## Part 2 — Institutional Design System Compliance

### 2.1 Design System Summary

The project enforces a strict institutional visual identity:

| Property | Standard |
|----------|----------|
| Primary color | `#fd7e14` (naranja institucional) |
| Sidebar / dark surfaces | `#0d233a` / `#163452` (azul oscuro) |
| Table headers | `#17324d` (dark blue) |
| Font | Poppins (Google Fonts) |
| Background | Orange gradient fading to `#f8f9fa` |
| Shadows | Subtle: `0 4px 15px rgba(0,0,0,0.05)` |
| Border radius | `12px` (cards), `8px` (buttons, inputs) |
| No external CSS frameworks | Bootstrap, Tailwind, etc. strictly prohibited |

### 2.2 Form Component Compliance Checklist

Every form component in the project must pass the following checks. Use this checklist per-component.

#### A. Dark Overlay / Container

- [ ] **Modal forms** use `ddjj-modal-overlay` as the outer wrapper.
- [ ] **Inline forms** use one of: `inline-form-container`, `administradores-inline-form`, `proyecto-form`, or `acta-form`.
- [ ] **No white-background form containers.** The background must be `--sidebar-hover` (`#163452`) or its semitransparent variant.
- [ ] The overlay opacity is `rgba(15, 23, 42, 0.62)` — never opaque, never transparent.

#### B. Form Structure (Standard Modal)

- [ ] Outer: `ddjj-modal-overlay` → `standard-modal` → `standard-modal-header` / `standard-modal-body` / `standard-modal-footer`.
- [ ] Header: `<h3>` with white text, padding `18px 24px`, bottom border `rgba(255,255,255,0.08)`.
- [ ] Body: padding `24px`, `overflow: auto`, `flex: 1`.
- [ ] Footer: `display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px;` with top border matching header.
- [ ] Footer buttons: "Cancelar" (`btn-secondary`) left, "Guardar" (`btn-primary`) right.

#### C. Labels

- [ ] Every `<input>` has a corresponding `<label htmlFor="...">`.
- [ ] Label color is `#cbd5e1` (on dark backgrounds) or inherited (on light).
- [ ] Label size: `0.85rem`, weight `500`.
- [ ] Never use placeholder as label.

#### D. Inputs / Selects / Textareas

- [ ] Wrapped in `.form-group-filter`.
- [ ] Background: `var(--table-row-bg)` (white).
- [ ] Border: `1px solid var(--table-border)`, radius `10px`.
- [ ] Padding: `12px 14px`.
- [ ] Focus ring: `border-color: var(--primary-color)` + `box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.10)`.
- [ ] Placeholder color: `#6b7785`.
- [ ] Textarea: `resize: vertical`, `min-height: 170px`.

#### E. Form Grid / Layout

- [ ] Two-column layout uses `preceptor-form-row--two` (`grid-template-columns: repeat(2, minmax(0, 1fr))`).
- [ ] Full-width field uses `preceptor-form-full` (`grid-column: 1 / -1`).
- [ ] Asymmetric grid uses `preceptor-form-grid` (`1fr / minmax(160px, 220px)`).
- [ ] Gap between fields: `14px`.
- [ ] Sections separated by `preceptor-form-section` (top border + padding-top).

#### F. Buttons

- [ ] Primary action: `btn btn-primary` (orange `#fd7e14`, white text).
- [ ] Cancel action: `btn btn-secondary` (gray `#6c757d`, white text).
- [ ] Destructive action: `btn btn-danger` (red `#dc3545`).
- [ ] No invented button colors or styles.
- [ ] Loading state: `disabled={saving}`, text changes to "Guardando...".

#### G. Error / Success Messages

- [ ] Errors rendered inline via state, never via `alert()`.
- [ ] Error style: `.error-message` or state-driven `<p>` with `color: #b91c1c`.
- [ ] Success style: state-driven `<p>` with `color: #15803d` or `#1e7e34`.
- [ ] Messages placed above the form or below the relevant field.

#### H. Responsive Behavior

- [ ] At `768px`: form grid collapses to single column.
- [ ] At `768px`: buttons go full-width.
- [ ] Modal max-width respects viewport: `min(1100px, 100%)`.
- [ ] Modal max-height: `min(92vh, 900px)`.

### 2.3 Per-Component Audit Matrix

Audit each component file against the checklist above. Record findings here.

| Component | File | Modal/Inline | Dark BG | Labels | Grid | Buttons | Responsive | Status |
|-----------|------|-------------|---------|--------|------|---------|------------|--------|
| FormModal | `Shared/FormModal.jsx` | Modal | `standard-modal` | — | — | — | — | PASS |
| ConfirmDeleteModal | `Shared/ConfirmDeleteModal.jsx` | Modal | `confirm-modal` | — | — | — | — | PASS |
| ComunicadosView | `Shared/ComunicadosView.jsx` | Inline | `comunicados-form` | TBD | TBD | TBD | TBD | TODO |
| ActividadesView | `Shared/ActividadesView.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| DiagnosticosView | `Shared/DiagnosticosView.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Preceptores/notas | `Preceptores/notas.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Preceptores/actas | `Preceptores/actas.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Administracion/alumnos | `Administracion/alumnos.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Administracion/docentes | `Administracion/docentes.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Administracion/materias | `Administracion/materias.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Administracion/cursos | `Administracion/cursos.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Administracion/horarios | `Administracion/horarios.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Administracion/comunicados | `Administracion/comunicados.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Administracion/administradores | `Administracion/administradores.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Administracion/asignacionMaterias | `Administracion/asignacionMaterias.jsx` | TBD | TBD | TBD | TBD | TBD | TBD | TODO |
| Login | `Login/login.jsx` | N/A (own screen) | — | TBD | TBD | TBD | TBD | LEGACY |

### 2.4 UX Compliance Checklist

- [ ] **No `alert()` calls** in any component.
- [ ] **`window.confirm()`** used for all deletions.
- [ ] **`refreshData()`** called after every CRUD operation.
- [ ] **No React Router** — navigation by state only.
- [ ] **`aria-label`** on all icon-only buttons.
- [ ] **`aria-hidden="true"`** on all decorative `<i>` icons.
- [ ] **`htmlFor`** on all `<label>` elements.
- [ ] **Sidebar order preserved:** Mi Perfil first, Cerrar Sesión last.

---

## Part 3 — Shared Component Extraction Methodology

### 3.1 Current `Shared/` Inventory

| Component | Purpose | Used By |
|-----------|---------|---------|
| `ActividadesView.jsx` | Displays student activities list | Multi-role |
| `AdelantosHoras.jsx` | Hours advance form | Docentes |
| `AsistenciaMateriaDetalle.jsx` | Attendance detail per subject | Multi-role |
| `CambiarRolButton.jsx` | Role-switching button | Multi-role |
| `ComunicadosView.jsx` | Comunicados display form | Multi-role |
| `ConfirmDeleteModal.jsx` | Deletion confirmation modal | Multi-role |
| `DiagnosticosView.jsx` | Diagnostics view | Multi-role |
| `FormModal.jsx` | Standard modal wrapper | Multi-role |
| `LoadingScreen.jsx` | Loading state display | Multi-role |
| `LoadingSpinner.jsx` | Compact spinner | Multi-role |
| `Logo.jsx` | App logo component | Multi-role |
| `SeleccionRol.jsx` | Role selection screen | Multi-role |

### 3.2 Extraction Identification Method

To identify candidates for extraction into `Shared/`, apply the following process:

#### Step 1 — Cross-Role Usage Scan

```bash
# Find JSX components imported across multiple role directories
for role in Administracion Preceptores Profesores Alumno Familia JefePreceptores; do
  echo "=== $role ==="
  grep -rn "import.*from" frontend/src/components/$role/ | \
    grep -oP "from ['\"]([^'\"]+)" | sort | uniq
done
```

If the same component file or the same JSX pattern (class + structure) appears in 2+ role directories, it is a **strong extraction candidate**.

#### Step 2 — CSS Class Cross-Reference

```bash
# Find CSS classes used in multiple role directories
for class in $(grep -oP '\.[a-zA-Z_-]+' frontend/src/index.css | sort -u); do
  count=$(grep -rl "$class" frontend/src/components/*/ 2>/dev/null | \
    sed 's|frontend/src/components/||; s|/.*||' | sort -u | wc -l)
  if [ "$count" -gt 1 ]; then
    echo "$class → used by $count roles"
  fi
done
```

#### Step 3 — Inline Logic Extraction

Components that are not yet in `Shared/` but contain reusable logic patterns:

| Pattern | Current Location | Proposed Shared Component |
|---------|-----------------|--------------------------|
| `StatCard` (inline in every `Panel{Rol}.jsx`) | Each `Panel{Rol}.jsx` | `Shared/StatCard.jsx` |
| `EmptyState` (empty table row) | Multiple table components | `Shared/EmptyState.jsx` |
| `FilterBar` (year + course selectors) | `Administracion/FiltrosAnioCurso.jsx`, `Preceptores/FiltrosAnioCurso.jsx` | `Shared/FiltrosAnioCurso.jsx` (consolidate the two existing) |
| `TablaCRUD` (table + empty state + action buttons pattern) | Every list component | `Shared/TablaCRUD.jsx` |
| `ProfileGrid` (personal data grid in profiles) | Each `Panel{Rol}.jsx` | `Shared/ProfileGrid.jsx` |

### 3.3 Extraction Process

> ⚠ Extraer a `Shared/` es operación **MUTANTE**. Antes de mover un archivo: Fase 0–6 de [`Modification-Flow&CodebaseRules.md`](Modification-Flow%26CodebaseRules.md) — `rg -w` del componente y de sus clases CSS en todo el repo, actualizar **todos** los imports, borrar duplicados, `npx vitest run` y `npx vite build`. Nombre PascalCase en español (FE-1 / FE-2).

When a component is identified as a Shared candidate:

1. **Verify it has no role-specific dependencies.** It must not import from role-specific folders or reference `user.role` for rendering logic (use props instead).
2. **Abstract role-specific data into props.** For example, `StatCard` currently receives inline data — extract it to accept `{ icon, value, label, color }` props.
3. **Move the file to `components/Shared/`** with the Spanish name following PascalCase conventions.
4. **Move associated CSS** (if any component-specific styles exist) into the corresponding section of `index.css` under a new `/* === SHARED COMPONENTS === */` comment block.
5. **Update all imports** across every role directory that previously duplicated the logic.
6. **Delete the original duplicates.** Never leave both the original and the shared version.
7. **Verify no circular dependencies** exist after extraction.

### 3.4 Extraction Priority Matrix

| Candidate | Effort | Impact | Priority |
|-----------|--------|--------|----------|
| `StatCard` | Low | High (used in 5+ panels) | **P0** |
| `FiltrosAnioCurso` consolidation | Medium | High (2 duplicates exist) | **P0** |
| `TablaCRUD` pattern | High | High (eliminates 15+ duplicates) | **P1** |
| `ProfileGrid` pattern | Medium | Medium (5 panel components) | **P1** |
| `EmptyState` component | Low | Low (simple but repeated) | **P2** |

### 3.5 Anti-Patterns to Prevent

| Anti-Pattern | Description | Prevention |
|-------------|-------------|------------|
| Duplicated shared components | Same component exists in both `Shared/` and a role folder | Enforce import from `Shared/` only |
| God components | Shared component with 15+ props for every use case | Keep props focused; prefer composition over configuration |
| Role-aware Shared components | Component checks `user.role` internally | Always receive role as a prop; keep Shared role-agnostic |
| Stale shared components | Shared component no longer used by any role | Audit quarterly with unused-import check |
| CSS leakage | Shared component CSS class names conflict with role CSS | Use BEM-like naming: `.shared-{component}__{element}` |

---

## Part 4 — Responsive Grid Audit

### 4.1 Breakpoint Map

| Breakpoint | Target | Sidebar | Content | Grid |
|------------|--------|---------|---------|------|
| `> 992px` | Desktop | 260px fixed, full menu | `margin-left: 300px` | 2–4 columns |
| `≤ 992px` | Tablet | 80px icon-only | `margin-left: 100px` | 2 columns |
| `≤ 768px` | Mobile | Bottom bar, 60px height | `margin-left: 0`, full-width | 1 column |
| `≤ 480px` | Small mobile | Bottom bar, 65px | `margin: 0`, reduced padding | 1 column |

### 4.2 Responsive Audit Checklist

- [ ] **All grids collapse to single column at 768px.** Verify `grid-template-columns` is overridden.
- [ ] **Tables have horizontal scroll.** `.table-responsive` with `overflow-x: auto` and `min-width: 650px` on `<table>`.
- [ ] **Sidebar transforms correctly.** At 768px: fixed bottom, horizontal layout, brand hidden.
- [ ] **Buttons go full-width at 768px** (except `.btn-sm`).
- [ ] **Filter rows stack vertically at 768px.** `.filter-row` → `flex-direction: column`.
- [ ] **Cards reduce padding.** `30px` → `20px` (768px) → `15px` (480px).
- [ ] **No horizontal overflow.** `overflow-x: hidden` on `html, body` at mobile.
- [ ] **Bottom padding accounts for mobile sidebar.** `padding-bottom: 95px` on `.main-content` at 768px.

---

## Part 5 — Action Plan Summary

> ⚠ **Ninguna acción P0/P1/P2 se ejecuta para “ver el error”.** Todas modifican `index.css` o JSX. Seguir Fases 0–6 de [`Modification-Flow&CodebaseRules.md`](Modification-Flow%26CodebaseRules.md) por cada símbolo. Variables CSS nuevas en inglés (`--danger`, `--success`, `--radius-sm`, etc.) requieren registro en `DECISIONES.md` (§7) **antes** de crearlas, o nombres en español.

### Immediate Actions (P0)

1. **Resolve duplicate selectors** (`.main-header`, `.card`, `.table-responsive`, `.user-avatar`) — consolidate into single definitions. ✅ **RESUELTO 2026-08-24** — bloques sombreados eliminados de `index.css` (conservadas `.main-header-subtitle`, `.user-profile-info`; recortada la regla redundante de `.table-responsive` dentro del media query 768px); quedan las definiciones únicas canónicas (sección HEADER/CARDS/TABLAS). Verificado: Vitest 85 OK + `vite build` OK.
2. **Extract hardcoded colors into CSS variables** — create `--danger`, `--success`, `--secondary`, `--warning`, `--info-bg`, `--error-text`, `--label-dark`, `--placeholder`, `--bg-subtle`, `--border-light`, `--overlay-border`, `--overlay-dark`. *(Pendiente — fuera del alcance P0 ejecutado; requiere registro en DECISIONES.md §7 o nombres en español.)*
3. **Consolidate `FiltrosAnioCurso`** — merge the two existing copies (Administracion + Preceptores) into `Shared/FiltrosAnioCurso.jsx`. ✅ **RESUELTO 2026-08-24** — componente unificado en `Shared/FiltrosAnioCurso.jsx` (modo controlado para Preceptores vía `anioLectivo/onAnioChange`; modo autónomo para Administración vía `cursosObj/defaultToFirst`), helpers movidos a `Shared/cursoFilters.js`, imports actualizados en 9 consumidores y originales eliminados (sin leer `user.role`). Verificado: Vitest 85 OK + `vite build` OK.

### Short-Term Actions (P1)

4. **Extract `StatCard`** into `Shared/StatCard.jsx` and replace all inline implementations.
5. **Complete the per-component compliance audit** (fill in the matrix in section 2.3).
6. **Add `--radius-sm` (8px)** variable and replace all hardcoded `border-radius: 8px`.
7. **Add spacing variables** (`--spacing-sm`, `--spacing-md`, `--spacing-lg`) for repeated padding/margin values.

### Medium-Term Actions (P2)

8. **Evaluate `TablaCRUD` extraction** — analyze whether the table + empty state + action pattern can be abstracted.
9. **Remove all inline `style={{}}`** that duplicate existing CSS classes.
10. **Add missing `aria-*` attributes** across all icon-only buttons.
11. **Run orphan-class analysis** — identify and remove unused CSS rules.
12. **Document the design system** — maintain this file as the living reference for all UI work.

---

## Appendix A — CSS File Section Map

| Line Range | Section |
|-----------|---------|
| 1–25 | `:root` variables |
| 27–32 | Global reset (`*`) |
| 34–40 | `body` |
| 42–64 | Button utilities (`.btn-*`) |
| 66–84 | Alert utilities |
| 86–237 | Login screen |
| 239–398 | Dashboard layout (sidebar, tabs, main content) |
| 400–414 | Main header |
| 416–432 | User profile info / avatar |
| 438–456 | Notifications empty state |
| 458–479 | View sections + cards |
| 490–590 | Utility classes (flex, margin, text, form containers, search, badges) |
| 592–650 | Base table styles + attendance badges |
| 650–745 | Boletin (academic report) styles |
| 750–810 | Badges, filter row, historial |
| 810–960 | Form groups, filters, upload boxes |
| 968–1050 | Comunicados form (dark) |
| 1052–1130 | Upload, materias grid, checkbox container |
| 1123–1180 | Familia components |
| 1183–1219 | Responsive 992px + 768px (sidebar collapse) |
| 1221–1680 | Preceptor-specific styles (tabs, forms, modals, actas, boletin) |
| 1682–1831 | Responsive 768px (mobile adjustments) |
| 1838–1863 | Responsive 480px |
| 1864–1880 | Responsive 768px (table overflow) |
| 1882–1995 | Header/cards/tables redefinition (duplicates) |
| 1999–2035 | Responsive 992px redefinition (duplicate) |
| 2037–2202 | Responsive 768px redefinition (duplicate) |
| 2204–2340 | Vista horarios (schedule grid) |
| 2343–2480 | Standard modal + dark form containers |
| 2487–2643 | Calendario institucional |
| 2645–2753 | Toast notifications |
| 2755–2892 | Adelantos form + modulos grilla + radio options |
| 2913–2964 | Confirm delete modal |
| 2966–3034 | Loading screen |
| 3036–3120 | Role selection screen |

## Appendix B — Class Naming Convention Reference

| Pattern | Convention | Example |
|---------|-----------|---------|
| Component root | `.kebab-case` | `.sidebar-brand` |
| Modifier | `--modifier` | `.preceptor-form-row--two` |
| BEM element | `__element` | `.confirm-modal__title` |
| BEM modifier | `--modifier` | `.modulo-card--checked` |
| Utility | `.type-value` | `.mt-16`, `.text-center`, `.flex-row` |
| State | `.component--state` | `.toast--saliendo`, `.loading-screen--dark` |
| Spanish names | Always | `.asistencia-badge`, `.campo-obligatorio` |

---

*Generated: 2026-08-19 | Project: Mi Secundaria 7 | CSS file: `frontend/src/index.css` (3120 lines)*
