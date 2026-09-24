# Estándar Visual — Todos los Roles

Directrices visuales unificadas aplicadas primero en **Docente** y **Estudiante** y replicadas en el resto de los roles (Preceptor, Jefe de Preceptores, Administración, Familia). **No modifican funcionalidad**: solo maquetado, íconos y clases.

> Regla de oro: **nada de lo visual debe romper ni agregar funciones.** Los identificadores de vista (`id`) y los destinos de navegación (`navDestinos.js`) no cambian.

---

## 1. Bloque superior (Header)

Todos los dashboards usan el mismo header oscuro institucional.

**Estructura obligatoria:**

```
<header className="main-header main-header--dark">
  <div className="main-header-left">
    <div className="main-header-greeting">
      <h2>
        <span className="greeting-saludo">Bienvenido:</span>{' '}
        <span className="greeting-nombre">{Nombre Apellido}</span>
      </h2>
      <p className="main-header-subtitle">
        <i className="fas fa-school font-accent" aria-hidden="true" />
        Subtítulo informativo (curso, rol, etc.)
      </p>
    </div>
    <!-- (opcional) selectores globales con .global-select y .selector-group -->
  </div>

  <div className="user-profile-info user-profile-card">
    <div className="user-avatar-wrap">
      <div className="user-avatar">{INICIALES}</div>
    </div>
    <span className="badge role-badge-display">
      <span className="role-dot" aria-hidden="true" />
      ROL
    </span>
  </div>
</header>
```

- Clases CSS globales: `.main-header`, `.main-header--dark`, `.main-header-left`, `.main-header-greeting`, `.greeting-saludo`, `.greeting-nombre`, `.main-header-selectors`, `.global-select`, `.user-profile-card`, `.user-avatar-wrap`, `.role-dot`.
- Iniciales: primeras letras de nombre y apellido en mayúscula (o `letra del username` si no hay persona).
- Si el rol no necesita selectores de Curso/Materia, **no se agregan**.
- La barra naranja superior la genera el `::before` de `.main-header` solo.

## 2. Sidebar (acordeones)

Menú agrupado en **secciones desplegables** con íconos.

**`sidebarMenu.js`** — dos exports:

```js
export const menuItems = [
  // ítem simple
  { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-tie' },

  // sección con hijos
  {
    id: 'gestion-academica',
    label: 'Gestión Académica Diaria',
    icon: 'fa-chalkboard-teacher',
    children: [
      { id: 'sub-vista', label: 'Vista', icon: 'fa-book-open' },
    ],
  },
];

export const bottomItems = [
  { id: 'notificaciones', label: 'Notificaciones', icon: 'fa-bell' },
];
```

**`Sidebar.jsx`** — comportamiento idéntico al de Docente/Estudiante:

- `useState('seccion-inicial')` con la sección abierta por defecto.
- `toggleSection(id)` con `setTimeout(280ms)` + `scrollIntoView` (para mostrar contenido y siguiente desplegable).
- Estructura: `.sidebar-brand` → `.sidebar-menu-wrapper` (con `ref`) → `.sidebar-menu` (render de `menuItems` con hijos → `.sidebar-section-header` + chevron `fa-chevron-down rotated` + `.sidebar-submenu`).
- Inferior: `.sidebar-bottom-fixed` → `.sidebar-bottom-menu` (`bottomItems`, con `CampanaNotificaciones` para `notificaciones`) → `.sidebar-logout` (`CambiarRolButton` + botón `sidebar-logout-btn`).

## 3. Títulos de panel

Todo panel usa `card-header-flex` con **título con ícono idéntico al ítem del sidebar** y botón de acción en la misma línea:

```jsx
<div className="card-header-flex">
  <div>
    <h3><i className="fas fa-tasks" aria-hidden="true" /> Actividades</h3>
    <p className="empty-state-message" style={{ margin: '6px 0 0' }}>Descripción breve.</p>
  </div>
  <button type="button" className="btn btn-primary">
    <i className="fas fa-plus" aria-hidden="true" /> Nueva actividad
  </button>
</div>
```

- Íconos de referencia: Asistencia `fa-calendar-check` · Libro/Contenidos `fa-book-open` · Actividades `fa-tasks` · Calificaciones `fa-clipboard-list`/`fa-graduation-cap` · Proyectos `fa-project-diagram` · Comunicados `fa-bullhorn` · Notificaciones `fa-bell` · Calendario `fa-calendar-alt` · Actas `fa-file-signature` · Materias adeudadas `fa-book-medical`.
- Subsecciones: `h4.preceptor-section-title` con su ícono.

## 4. Piezas compartidas ya estandarizadas

- `FormModal` y `ConfirmDeleteModal`: renderizan con **Portal a `document.body`** (imposible que otra tarjeta quede encima). No moverlos dentro de una tarjeta.
- `.card` usa el efecto vidrio vía `::before` (NUNCA poner `backdrop-filter` o `transform` directamente en `.card`: atrapa los modales `position:fixed`).
- Diagnósticos = una sola tarjeta "Diagnósticos" con botón "Crear" en el header.
- Botones/inputs/tablas/formas: todo vía `index.css` global (no duplicar por archivo).

## 5. Checklist de aplicación por rol nuevo

- [ ] Header → `main-header--dark` (saludo + avatar + badge con `role-dot`).
- [ ] `sidebarMenu.js` agrupado en secciones + `bottomItems` (Notificaciones abajo).
- [ ] `Sidebar.jsx` con acordeones (`sidebar-section-header`, `sidebar-submenu`, chevron, auto-scroll).
- [ ] Íconos en títulos de paneles y botones en la línea del título.
- [ ] `npm run build` en verde (dentro de `frontend`).
- [ ] Reiniciar dev server sin procesos `node` colgados en el puerto.