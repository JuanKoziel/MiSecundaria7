  # DESARROLLO UI — Guía oficial de diseño y desarrollo visual

  Este documento define el estándar exacto para toda la interfaz del proyecto. Cualquier IA o desarrollador que trabaje en el frontend debe seguirlo estrictamente para mantener la consistencia visual en todos los módulos y roles.

  ---

  ## Filosofía general del diseño

  ### Estilo
  - Moderno, plano, con sombras sutiles (`var(--shadow): 0 4px 15px rgba(0,0,0,0.05)`).
  - Bordes redondeados (`var(--radius): 12px`).
  - Gradiente de fondo: naranja en la parte superior que se desvanece a gris claro (`linear-gradient(180deg, #fd7e14 0%, #f8f9fa 400px, #f8f9fa 100px)`).
  - Tipografía: Poppins en todo el sistema (cargada desde Google Fonts en `index.html`).

  ### Aspecto institucional
  - El color primario (`--primary-color: #fd7e14`) es el naranja institucional.
  - El sidebar es azul oscuro (`--sidebar-color: #0d233a`), que transmite seriedad.
  - Los encabezados de tabla son del mismo azul oscuro (`--table-header-bg: #17324d`).
  - No se usan colores llamativos ni degradados múltiples.

  ### Consistencia visual
  - Todos los roles comparten el mismo layout: sidebar izquierdo + header superior + cards blancas.
  - Todos los CRUD se ven y funcionan igual.
  - Todos los formularios usan las mismas clases CSS.
  - Todos los botones siguen los mismos colores y tamaños.

  ### Responsive obligatorio
  - El sistema debe funcionar en desktop, tablet y móvil.
  - Los breakpoints son 992px, 768px y 480px.
  - En móvil, el sidebar se convierte en barra inferior.

  ### Reutilización de componentes
  - No crear un componente si ya existe uno similar.
  - No crear un filtro si ya existe `FiltrosAnioCurso`.
  - No crear un formulario desde cero: seguir el **"Estándar oficial de formularios"** más abajo.
  - No crear un perfil desde cero: copiar el patrón de `PanelAdmin.jsx`.

  ---

  ## Formularios — Versión legacy (en migración)

  > **ATENCIÓN:** Todos los formularios nuevos deben seguir el **"Estándar oficial de formularios"** definido en la sección siguiente. Esta sección describe el patrón anterior y se mantiene solo para compatibilidad con formularios que aún no han sido migrados.

  ### Clases de layout disponibles (compartidas con el nuevo estándar)

  | Clase | Cuándo usarla |
  |-------|---------------|
  | `form-group-filter` | **SIEMPRE** para cada par label+campo |
  | `preceptor-form-section` | Para cada grupo de campos separado por borde superior |
  | `preceptor-form-row` | Fila simple de una columna |
  | `preceptor-form-row--two` | Fila de 2 columnas iguales |
  | `preceptor-form-row--status` | Fila de 3 columnas (estado + 2 fechas) |
  | `preceptor-form-grid` | Grid de 2 columnas asimétrico (1fr / minmax(160px,220px)) |
  | `preceptor-form-full` | Campo que ocupa todo el ancho del grid |
  | `preceptor-status-toggle` | Checkbox de estado estilizado |
  | `preceptor-cursos-multiselect` | Grid de opciones seleccionables |
  | `preceptor-curso-option` | Cada opción del multiselect |
  | `preceptor-curso-option--selected` | Opción seleccionada |

  ### Contenedores inline (fondo oscuro institucional)
  - Para formularios inline (no modales): usar `className="inline-form-container"` en el `<form>` o contenedor.
  - Para formularios grandes tipo administradores: usar `className="administradores-inline-form"`.
  - Para planificaciones: usar `className="proyecto-form"`.
  - Para actas: usar `className="acta-form"`.

  ---

  ## Estándar oficial de formularios

  Este es el **único estándar permitido** para todos los formularios del sistema. Cualquier formulario nuevo debe seguirlo obligatoriamente. No se permiten diseños alternativos.

  ### Filosofía
  - Fondo azul oscuro institucional (`--sidebar-hover`) para el contenedor del formulario.
  - Overlay semitransparente para modales.
  - Labels en gris muy claro (`#cbd5e1`) para máxima legibilidad sobre fondo oscuro.
  - Inputs y textareas con fondo blanco, bordes redondeados y focus naranja.
  - Botones del sistema (`.btn-primary`, `.btn-secondary`, etc.) sin cambios.
  - Espaciado generoso y organización mediante grid.

  ### Modal centrado (para formularios que abren en ventana)

  ```jsx
  <div className="ddjj-modal-overlay" role="presentation" onClick={onClose}>
    <div className="standard-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
      <div className="standard-modal-header">
        <h3>Título del formulario</h3>
      </div>

      <form className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
        {/* campos */}
      </form>

      <div className="standard-modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar</button>
      </div>
    </div>
  </div>
  ```

  #### Clases CSS del modal

  | Clase | Propósito |
  |-------|-----------|
  | `ddjj-modal-overlay` | Overlay oscuro semitransparente. Centra el modal con flex. |
  | `standard-modal` | Contenedor del modal. Fondo `--sidebar-hover`, bordes redondeados, sombra. |
  | `standard-modal-header` | Header con borde inferior sutil. Título en blanco. |
  | `standard-modal-body` | Cuerpo con scroll si es necesario. Padding de 24px. |
  | `standard-modal-footer` | Botonera alineada a la derecha con borde superior. |

  #### Estructura visual
  - **Overlay**: `rgba(15, 23, 42, 0.62)` — oscuro pero no opaco.
  - **Modal**: `background: var(--sidebar-hover)` (#163452) — azul oscuro institucional.
  - **Header**: padding 18px 24px, borde inferior `rgba(255,255,255,0.08)`, título blanco.
  - **Body**: padding 24px, scroll vertical automático si el contenido excede.
  - **Footer**: padding 16px 24px, borde superior `rgba(255,255,255,0.08)`, botones a la derecha.

  ### Formulario inline (dentro de card o sección)

  ```jsx
  <form onSubmit={handleSubmit} className="inline-form-container">
    <div className="preceptor-form-row preceptor-form-row--two">
      <div className="form-group-filter">
        <label htmlFor="campo-id">Label del campo</label>
        <input id="campo-id" type="text" value={...} onChange={...} required />
      </div>
    </div>

    <div className="standard-modal-footer" style={{ marginTop: '16px' }}>
      <button type="submit" className="btn btn-primary">Guardar</button>
      <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
    </div>
  </form>
  ```

  ### Labels
  - Usar siempre `<label htmlFor="id-del-input">Texto</label>`.
  - Sobre fondo oscuro institucional: color `#cbd5e1` (gris muy claro).
  - Tamaño: `0.85rem`.
  - Peso: `500`.
  - Nunca usar placeholder como label.

  ### Inputs
  - Siempre dentro de `.form-group-filter`.
  - Fondo blanco (`var(--table-row-bg)`).
  - Bordes: `1px solid var(--table-border)` con `border-radius: 10px`.
  - Padding: `12px 14px`.
  - Focus: `border-color: var(--primary-color)` + `box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.10)`.
  - Placeholder: `color: #6b7785`.

  ### Textareas
  - Mismo estilo que inputs.
  - `resize: vertical`, `min-height: 170px`.
  - En comunicados: `min-height: 220px`.

  ### Selects
  - Misma apariencia que los inputs.
  - Opción por defecto: `<option value="">Seleccionar...</option>`.

  ### Botones
  - NO cambiar colores, tamaños ni clases existentes.
  - Guardar/Crear: `className="btn btn-primary"`.
  - Cancelar/Cerrar: `className="btn btn-secondary"`.
  - Ver más en la sección [Botones](#botones).
  - La botonera SIEMPRE usa `className="standard-modal-footer"`.

  ### Espaciados
  - Gap entre campos en grid: `14px`.
  - Padding del body modal: `24px`.
  - Padding del form inline: `16px` a `20px`.
  - Separación entre último campo y botones: el footer tiene `padding: 16px 24px` con borde superior.

  ### Organización de campos
  - Usar filas de 2 columnas con `preceptor-form-row--two`.
  - Usar fila completa con `preceptor-form-full`.
  - Usar grid asimétrico con `preceptor-form-grid`.
  - Ver tabla de clases de layout en sección anterior.

  ### Títulos de sección dentro del formulario
  - `<h4>` con `text-transform: uppercase; font-size: 0.9rem; font-weight: 700;`.
  - Sobre fondo oscuro: `color: #ffffff`.

  ### Mensajes de error y éxito
  - Misma estructura que en versión legacy (ver arriba).
  - Sobre fondo oscuro, los colores `#b91c1c` (error) y `#15803d` (éxito) son legibles.

  ### Regla obligatoria
  - **Todos los formularios del sistema deben seguir este estándar.**
  - No crear formularios con fondo blanco.
  - No crear formularios sin overlay si usan modal.
  - No cambiar colores de labels, inputs o botones.
  - Reutilizar las clases CSS existentes antes de crear nuevas.

  ---

  ## Botones

  ### Clases base

  | Clase | Padding | Font-size | Border-radius |
  |-------|---------|-----------|---------------|
  | `.btn` | 10px 18px | 1rem (herencia) | 8px |
  | `.btn-sm` | 6px 12px | 0.85rem | 8px |
  | `.table-download-btn` | 5px 10px | 0.8rem | 8px |

  ### Tipos y colores

  | Clase | Color | Hover | Cuándo usar |
  |-------|-------|-------|-------------|
  | `btn-primary` | `var(--primary-color)` naranja | `var(--primary-dark)` (#e06d0f) | Crear, Guardar, Enviar, Acción principal |
  | `btn-secondary` | `#6c757d` gris | `#5a6268` | Cancelar, Cerrar, Editar (en tabla) |
  | `btn-danger` | `#dc3545` rojo | `#bd2130` | Eliminar, Desactivar, Acción destructiva |
  | `btn-success` | `#28a745` verde | `#218838` | Descargar, Ver PDF, Habilitar, Acción positiva |
  | `btn-link-danger` | `#dc3545` sin fondo | Subrayado | Links de eliminación dentro de texto |

  ### Iconos exactos por acción

  | Acción | Icono | Clase de botón | Texto (con icono) |
  |--------|-------|----------------|-------------------|
  | Crear / Nuevo | `fa-plus` | `btn-primary` | "Nuevo [Entidad]" |
  | Guardar | `fa-save` | `btn-primary` | "Guardar" / "Crear" / "Actualizar" |
  | Cancelar | `fa-times` | `btn-secondary` | "Cancelar" / "Cerrar" |
  | Editar (en tabla) | `fa-edit` | `btn-sm btn-secondary` | Solo icono (sin texto) |
  | Eliminar (en tabla) | `fa-trash` o `fa-trash-alt` | `btn-sm btn-danger` | Solo icono (sin texto) |
  | Desactivar | `fa-ban` | `btn-sm btn-danger` | Solo icono (sin texto) |
  | Habilitar | `fa-check` | `btn-sm btn-success` | Solo icono (sin texto) |
  | Descargar | `fa-download` | `btn-success table-download-btn` | "Descargar" |
  | Ver PDF / archivo | `fa-file-pdf` | `btn-success table-download-btn` | "Ver" |
  | Expandir / Colapsar | `fa-chevron-{up\|down}` | `btn-success table-download-btn` | "Ver [item]" / "Ocultar [item]" |
  | Enviar comunicado | `fa-paper-plane` | `btn-primary` | "Enviar comunicado" |
  | Subir archivo | `fa-file-upload` | `btn-sm btn-success` o `btn-danger` | "DDJJ pendiente" / "DDJJ presentada" |
  | Buscar | `fa-search` | No tiene botón específico | Se usa input de texto con placeholder |

  ### Estados
  - **Disabled**: `disabled={saving}` en botones de submit mientras se guarda.
  - **Hover**: definido en CSS para cada clase.
  - **Active**: `.btn-secondary.active` para botón presionado.
  - **Loading**: el texto del botón cambia a "Guardando..." cuando `saving=true`.

  ### Ubicación
  - Botón **Crear**: en `.card-header-flex`, lado derecho.
  - Botones **Editar/Eliminar/Descargar**: en la última columna de la tabla (`.acciones-cell`).
  - Botones **Guardar/Cancelar**: al final del formulario, en fila horizontal.
  - Botón **Cancelar**: siempre a la izquierda del botón Guardar (o secundario).

  ### Reglas de uso
  - Los botones dentro de tablas son **siempre `btn-sm` con solo icono** y sin texto.
  - Los botones con solo icono deben tener `aria-label` y `title`.
  - Los botones fuera de tablas pueden tener texto e icono.
  - No usar `btn-primary` para acciones destructivas.
  - No usar `btn-success` para acciones que no sean de descarga o éxito.

  ---

  ## Tablas

  ### Estructura HTML exacta

  ```jsx
  <div className="table-responsive">
    <table>
      <thead>
        <tr>
          <th>Columna 1</th>
          <th>Columna 2</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {datos.length === 0 ? (
          <tr>
            <td colSpan={N} className="empty-state-message">
              No hay ... registrados.
            </td>
          </tr>
        ) : (
          datos.map((item) => (
            <tr key={item.id}>
              <td className="table-cell-strong">{item.nombre}</td>
              <td>{item.campo}</td>
              <td className="acciones-cell">
                <button type="button" className="btn btn-sm btn-secondary" ...>
                  <i className="fas fa-edit" aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-sm btn-danger" ...>
                  <i className="fas fa-trash" aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
  ```

  ### Encabezados (`<th>`)
  - Fondo: `var(--table-header-bg)` (`#17324d`).
  - Texto: `var(--table-header-text)` (`#ffffff`), mayúsculas, `font-weight: 700`, `font-size: 0.85rem`.
  - Borde inferior: `2px solid var(--primary-color)`.
  - Separador vertical: `border-right: 1px solid rgba(255, 255, 255, 0.16)`.
  - Padding: `14px 16px`.

  ### Celdas (`<td>`)
  - Padding: `16px`.
  - Borde derecho: `1px solid var(--table-border)`.
  - Borde inferior: `1px solid var(--table-border)`.
  - Fondo fila par: `var(--table-row-alt)` (`#f4f7fb`).
  - Hover: `var(--table-row-hover)` (`#fff3e6`).
  - Texto: `var(--table-text)` (`#27313f`).
  - Última fila: sin borde inferior.

  ### Columna de acciones
  - Clase: `acciones-cell`.
  - `display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: center;`.
  - Siempre es la última columna.
  - Los botones dentro miden `btn-sm`.

  ### Texto en negrita
  - `.table-cell-strong` para nombres, títulos o identificadores principales.
  - DNI se muestra con `<strong>` además.

  ### Estado vacío
  - Una sola fila con `colSpan` igual a la cantidad de columnas.
  - Clase: `empty-state-message`. Texto: "No hay ...".
  - Color: `var(--text-light)`.

  ### Responsive
  - Contenedor: `.table-responsive` con `overflow-x: auto; -webkit-overflow-scrolling: touch;`.
  - En mobile: `min-width: 650px` en la tabla, `white-space: nowrap` en celdas.
  - Horizontal scroll siempre disponible para tablas anchas.

  ### Filas expandibles (para edición inline)
  ```jsx
  {datos.map((item) => (
    <Fragment key={item.id}>
      <tr>{/* datos */}</tr>
      {editing && editing.id === item.id && (
        <tr className="acta-desplegable-row">
          <td colSpan={N} style={{ padding: 0 }}>
            <FormComponente ... />
          </td>
        </tr>
      )}
    </Fragment>
  ))}
  ```

  ---

  ## Cards

  ### Estructura
  ```jsx
  <div className="card">
    <div className="card-header-flex">
      <h3>Título</h3>
      <button className="btn btn-primary">Acción</button>
    </div>
    {/* contenido */}
  </div>
  ```

  ### Estilos CSS
  - `.card`: `background: var(--white); padding: 30px; border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 30px;`.
  - `.card-header-flex`: `display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;`.

  ### En mobile
  - Padding se reduce a 18px (768px) o 15px (480px).
  - Border-radius se reduce a 10px (768px).
  - `.card-header-flex` pasa a columna, botones al 100%.

  ---

  ## Paneles (Dashboard Layout)

  ### Estructura del layout principal
  ```jsx
  <div className="dashboard-layout">
    <Sidebar />
    <main className="main-content">
      <Header />
      <div className="view-section active">
        {/* vistas condicionales */}
      </div>
    </main>
  </div>
  ```

  ### Main content
  - `margin-left: 300px` (sidebar 260px + gap).
  - `padding: 40px 40px 40px 20px` (más espacio a la derecha que a la izquierda).
  - En mobile: `margin-left: 0; padding: 16px; padding-bottom: 95px;`.

  ### Header (Main Header)
  ```jsx
  <header className="main-header">
    <div>
      <h2>Título</h2>
      <p className="main-header-subtitle">Subtítulo</p>
    </div>
    <div className="user-profile-info">
      <span className="badge role-badge-display">ROL</span>
      <div className="user-avatar">INICIAL</div>
    </div>
  </header>
  ```
  - Estilo: `background: var(--white); padding: 20px 30px; border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 30px;`.

  ### Vista condicional
  - Las vistas usan `display: none` por defecto (clase `.view-section`).
  - La vista activa usa `.view-section.active` que cambia a `display: block`.
  - Animación: `fadeIn` con 0.4s.

  ---

  ## Sidebar

  ### Estructura exacta
  ```jsx
  <aside className="sidebar">
    <div className="sidebar-brand">
      <i className="fas fa-school" />
      <span>MiSecundaria 7</span>
    </div>
    <div className="sidebar-menu-wrapper">
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.id} className={view === item.id ? 'active' : ''}>
            <button className="sidebar-menu-btn" onClick={() => setView(item.id)}>
              <i className={`fas ${item.icon}`} />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
    <div className="sidebar-logout">
      <button className="sidebar-menu-btn sidebar-logout-btn" onClick={onLogout}>
        <i className="fas fa-sign-out-alt" />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </aside>
  ```

  ### Reglas de orden
  1. **Mi Perfil** siempre es el primer item del menú.
  2. Los módulos funcionales van en el medio.
  3. **Notificaciones** siempre antes de Cerrar Sesión (no necesariamente inmediatamente antes, pero sí antes del logout).
  4. **Cerrar Sesión** siempre es el último elemento, separado por un borde superior.

  ### Estilos CSS
  - `.sidebar`: `width: 260px; background: var(--sidebar-color); color: var(--white); position: fixed; top: 20px; left: 20px; bottom: 20px; border-radius: var(--radius); padding: 30px 0; display: flex; flex-direction: column; z-index: 100;`.
  - `.sidebar-brand`: `padding: 0 25px 30px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);`.
  - `.sidebar-brand i`: `font-size: 1.8rem; color: var(--primary-color);`.
  - `.sidebar-menu-btn`: `display: flex; align-items: center; gap: 15px; padding: 14px 25px; color: rgba(255,255,255,0.7); border-left: 4px solid transparent; background: transparent; border: none; cursor: pointer; width: 100%; text-align: left; font-family: inherit; font-size: inherit;`.
  - `.sidebar-menu-btn:hover`: `color: var(--white); background: var(--sidebar-hover); border-left-color: var(--primary-color);`.
  - `li.active .sidebar-menu-btn`: mismos estilos que hover.
  - `.sidebar-logout`: `padding: 10px 0 0; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);`.
  - `.sidebar-logout-btn`: `color: #ff8a8a !important;`.

  ### Responsive
  - **992px (tablet)**: sidebar se reduce a 80px, solo iconos visibles.
  - **768px (móvil)**: sidebar se convierte en barra inferior fija de 60px, con iconos y sin brand.

  ### Sidebar Menu (configuración)
  Los items del menú se definen en arrays en archivos separados:
  - `Administracion/sidebarMenu.js` — 15 items.
  - `Profesores/sidebarMenu.js` — 9 items.
  - `Preceptores/sidebarMenu.js` — 10 items.
  - Alumno y Familia: menú hardcodeado en el dashboard JSX.

  Cada item: `{ id, label, icon, directorOnly? }`.

  ---

  ## Mi Perfil

  ### Reglas generales
  - Cada rol tiene su propio componente `Panel{Rol}.jsx`.
  - Debe mostrar información **útil para ese rol**, no solo datos personales.
  - Todos siguen la misma estructura visual.

  ### Estructura exacta

  ```jsx
  <div className="card">
    <div className="card-header-flex" style={{ marginBottom: '20px' }}>
      <h3>Perfil del {Rol}</h3>
      <span className="badge badge-presente" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
        <i className="fas fa-check-circle" /> Activo
      </span>
    </div>

    {/* Data grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '28px',
      background: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      borderLeft: '4px solid var(--primary-color)',
    }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
          Nombre Completo
        </label>
        <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '4px' }}>
          {apellido}, {nombre}
        </p>
      </div>
      {/* más campos... */}
    </div>

    {/* StatCards grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '16px',
      marginBottom: '28px',
    }}>
      <StatCard icon="fa-icon" value={valor} label="Label" />
    </div>

    {/* Info banner */}
    <div style={{
      background: '#f0f4ff',
      borderLeft: '4px solid var(--primary-color)',
      borderRadius: '8px',
      padding: '14px 20px',
      marginBottom: '28px',
      fontSize: '0.9rem',
      color: '#444',
      lineHeight: '1.6',
    }}>
      <i className="fas fa-info-circle" style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
      Texto informativo...
    </div>
  </div>
  ```

  ### Componente StatCard
  ```jsx
  function StatCard({ icon, value, label, color }) {
    return (
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
        border: '1px solid var(--border-color)',
      }}>
        <i className={`fas ${icon}`} style={{
          fontSize: '1.8rem',
          color: color || 'var(--primary-color)',
          marginBottom: '4px'
        }} aria-hidden="true" />
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginTop: '4px',
          color: color || 'inherit'
        }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
          {label}
        </div>
      </div>
    );
  }
  ```

  ### Contenido específico por rol
  - **Admin/Director**: datos personales + estadísticas del sistema (alumnos, docentes, cursos, etc.) + banner informativo.
  - **Docente**: datos personales + DDJJ (subir/ver archivo) + materias y cursos asignados.
  - **Preceptor**: datos personales + cursos asignados.
  - **Alumno**: datos personales + curso actual + promedio + inasistencias + materias.
  - **Familia/Tutor**: datos personales + cantidad de hijos vinculados.

  ---

  ## Responsive

  ### Breakpoints y cambios

  #### 992px (tablet vertical)
  - Sidebar: `width: 80px; padding: 20px 0;`
  - Sidebar brand span: `display: none;`
  - Sidebar menu text: `display: none;`
  - Sidebar menu items: `justify-content: center; padding: 15px 0;`
  - Main content: `margin-left: 100px; width: calc(100% - 100px); padding-right: 20px;`

  #### 768px (móvil)
  - Sidebar se transforma en **barra inferior**:
    - `position: fixed; bottom: 12px; left: 12px; right: 12px; top: auto; width: auto; height: 60px; flex-direction: row; padding: 0; border-radius: 18px; background: rgba(13,35,58,0.96);`
    - `.sidebar-brand`: `display: none;`
    - `.sidebar-menu`: `flex-direction: row; justify-content: space-around;`
    - `.sidebar-menu-btn`: `border-left: none; border-top: 4px solid transparent; padding: 18px 0;`
    - Active: `border-top-color: var(--primary-color);`
  - Main content: `margin-left: 0; width: 100%; padding: 16px; padding-bottom: 95px;`
  - Cards: `padding: 20px; border-radius: 20px;`
  - Filter row: `flex-direction: column;`
  - Form groups: `width: 100%; min-width: 100%;`
  - Tablas: `min-width: 650px; white-space: nowrap;`
  - Botones `.btn`: `width: 100%; justify-content: center;`
  - `.btn-sm`: mantiene `width: auto;`

  #### 480px (móvil pequeño)
  - Fuentes más pequeñas en headers.
  - Cards: `padding: 15px;`
  - `.materias-grid`: `grid-template-columns: 1fr;`

  ---

  ## CSS

  ### Reglas obligatorias

  1. **Nunca usar estilos inline** para valores que ya tienen clase CSS. Solo usar inline para valores dinámicos (colores que dependen de datos, márgenes excepcionales).

  2. **Nunca crear CSS duplicado.** Si un estilo ya existe en `index.css`, se reusa. No crear nuevos archivos CSS.

  3. **Reutilizar clases existentes.** Usar `btn-primary`, `form-group-filter`, `preceptor-form-row--two`, `table-responsive`, etc. No inventar clases equivalentes.

  4. **Usar variables CSS** cuando existan: `var(--primary-color)`, `var(--text-dark)`, `var(--sidebar-hover)`, etc.

  5. **Mantener la estructura del CSS.** Todo en `index.css`, organizado por secciones con comentarios `/* === */`.

  6. **No crear componentes CSS.** No usar CSS Modules, styled-components, Tailwind ni Bootstrap.

  7. **Nomenclatura kebab-case.** Clases como `card-header-flex`, `table-cell-strong`, `preceptor-status-toggle`.

  8. **Modificadores con doble guión.** `preceptor-form-row--two`, `preceptor-curso-option--selected`.

  ---

  ## UX

  ### Reglas obligatorias

  1. **No usar `alert()` en ningún caso.** Los errores y mensajes se muestran con variables de estado renderizadas en el JSX.

  2. **Usar `window.confirm()` exclusivamente para confirmar eliminaciones.** No usar modales ni diálogos personalizados.

  3. **No abrir ventanas nuevas.** Usar `target="_blank"` solo para enlaces a archivos externos (PDFs, DDJJ).

  4. **Mantener comportamiento consistente entre módulos.** Todos los CRUD deben funcionar igual: mismo patrón de botones, misma recarga, mismos mensajes.

  5. **Los formularios siempre son inline.** No crear modales. Salvo el componente `DdjjPreviewModal` que ya existe, no agregar nuevos modales.

  6. **Después de cada operación CRUD**, refrescar los datos llamando a `refreshData()` del `DataContext` o a la función específica del componente.

  7. **Los mensajes de éxito/error se auto-gestionan con variables de estado.** No usar timeouts para ocultarlos (salvo casos excepcionales como comunicados).

  8. **La navegación es por estado, no por URL.** No usar React Router.

  ---

  ## Accesibilidad

  ### Prácticas obligatorias

  1. **`aria-label`** en todos los botones que solo tienen icono (sin texto visible):
    ```jsx
    <button className="btn btn-sm btn-secondary" aria-label="Editar [entidad]" title="Editar">
      <i className="fas fa-edit" aria-hidden="true" />
    </button>
    ```

  2. **`aria-hidden="true"`** en todos los `<i>` de iconos decorativos.

  3. **`htmlFor`** en todos los `<label>`, vinculado al `id` del input correspondiente.

  4. **`title`** en botones con solo icono para tooltip.

  5. **`role="button"`** en elementos clickeables que no sean `<button>` (ej: divs con onClick).

  6. **`tabIndex={0}`** en elementos clickeables que no sean `<button>` para hacerlos focusables.

  7. **`onKeyDown`** para elementos con `role="button"` que manejan Enter/Espacio.

  8. **Campos requeridos**: usar el atributo `required` en los inputs obligatorios.

  ---

  ## Errores comunes que una IA nunca debe cometer

  ### ❌ Error 1: Crear botones con colores distintos
  No usar `#ff6600` en lugar de `var(--primary-color)`. No inventar nuevos colores de botón. Usar siempre las clases `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`.

  ### ❌ Error 2: Usar estilos inline en lugar de clases CSS
  No escribir `style={{ background: '#fd7e14', color: 'white', padding: '10px 18px', borderRadius: '8px' }}`. Usar `className="btn btn-primary"`.

  ### ❌ Error 3: Crear formularios con estructura diferente
  No poner labels dentro de placeholders. No usar divs sueltos sin `form-group-filter`. No agrupar campos sin `preceptor-form-row--two`. Copiar la estructura exacta de los formularios existentes.

  ### ❌ Error 4: Crear tablas con estilos diferentes
  No usar bordes negros, fondos blancos planos, o fuentes distintas. Seguir exactamente la estructura `<table>` con `<thead>` y `<tbody>`, usando las clases CSS existentes.

  ### ❌ Error 5: Romper la consistencia visual entre roles
  Un formulario en Administración debe verse igual que uno en Preceptores. Un botón "Crear" debe verse igual en todos los módulos. Las cards deben ser iguales en todos los dashboards.

  ### ❌ Error 6: Crear CSS duplicado
  No agregar nuevas reglas CSS a `index.css` si ya existe una clase que hace lo mismo. No crear nuevos archivos `.css`.

  ### ❌ Error 7: Usar fondo blanco en formularios
  Todos los formularios deben usar fondo oscuro institucional (`--sidebar-hover`). No usar `background: #ffffff` ni `background: var(--white)` en contenedores de formulario. Los modales centrados están permitidos (usar `standard-modal` + `ddjj-modal-overlay`). Los formularios inline deben usar `inline-form-container`, `administradores-inline-form`, `proyecto-form` o `acta-form`.

  ### ❌ Error 8: No usar `window.confirm()` para eliminaciones
  No eliminar sin confirmación. No usar `alert()` como confirmación. Solo `window.confirm()`.

  ### ❌ Error 9: Cambiar el orden del sidebar
  Mi Perfil siempre primero. Cerrar Sesión siempre último. No alterar este orden.

  ### ❌ Error 10: No refrescar datos después de operaciones CRUD
  Después de crear, actualizar o eliminar, siempre llamar a `refreshData()` o a la función específica del contexto.

  ### ❌ Error 11: Crear formularios sin la función `mensajeError`
  Siempre reutilizar la misma función para extraer mensajes de error de la API.

  ### ❌ Error 12: Usar `alert()` para errores
  Los errores se muestran con variables de estado (`error`/`success`) renderizadas en el JSX, no con `alert()`.

  ### ❌ Error 13: No usar las variables CSS existentes
  No escribir `#fd7e14` directamente si existe `var(--primary-color)`. No escribir `#333` si existe `var(--text-dark)`.

  ### ❌ Error 14: No mantener responsive
  Toda pantalla nueva debe funcionar en los tres breakpoints. No olvidar el scroll horizontal en tablas y la adaptación del sidebar en móvil.

  ### ❌ Error 15: Usar React Router o librerías externas
  La navegación es por estado. No instalar React Router, ni librerías UI, ni TypeScript.
