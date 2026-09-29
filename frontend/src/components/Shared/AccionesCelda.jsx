/**
 * AccionesCelda — columna "Acciones" de las tablas.
 *
 * Disposición canónica (punto 3.2 del plan):
 *   Fila 1:  Editar            | Habilitar / Deshabilitar
 *   Fila 2:  Programar         | Eliminar
 *
 * Para Docentes (admin) — extensión 5.8:
 *   Fila principal (siempre visible): Editar | Estado | Programar | Eliminar
 *   Fila "ver" (expandible):         Ver Actas | Ver Cursos | Ver DDJJ
 *   Ver DDJJ expande a: Descargar | Verificar | Eliminar | Recordar
 */

const ORDEN = {
  editar: 0,
  habilitar: 1,
  deshabilitar: 1,
  programar: 2,
  eliminar: 3,
  actas: 10,
  cursos: 11,
  ddjj: 12,
  'ddjj-descargar': 20,
  'ddjj-verificar': 21,
  'ddjj-eliminar': 22,
  'ddjj-recordatorio': 23,
  ver: 30,
  finalizar: 31,
};

const DEFINICION = {
  editar: { icono: 'fas fa-edit', clase: 'btn-secondary', nombre: 'Editar' },
  ver: { icono: 'fas fa-eye', clase: 'btn-success', nombre: 'Ver' },
  actas: { icono: 'fas fa-chevron-down', clase: 'btn-success', nombre: 'Actas' },
  cursos: { icono: 'fas fa-chevron-down', clase: 'btn-secondary', nombre: 'Cursos' },
  ddjj: { icono: 'fas fa-file-alt', clase: 'btn-primary', nombre: 'DDJJ' },
  habilitar: { icono: 'fas fa-check', clase: 'btn-success', nombre: 'Habilitar' },
  deshabilitar: { icono: 'fas fa-ban', clase: 'btn-warning', nombre: 'Deshabilitar' },
  programar: { icono: 'fas fa-calendar-alt', clase: 'btn-secondary', nombre: 'Programar' },
  'ddjj-descargar': { icono: 'fas fa-download', clase: 'btn-secondary', nombre: 'Descargar DDJJ' },
  'ddjj-verificar': { icono: 'fas fa-check', clase: 'btn-secondary', nombre: 'Verificar DDJJ' },
  'ddjj-eliminar': { icono: 'fas fa-trash', clase: 'btn-danger', nombre: 'Eliminar DDJJ' },
  'ddjj-recordatorio': { icono: 'fas fa-bell', clase: 'btn-secondary', nombre: 'Recordar DDJJ' },
  finalizar: { icono: 'fas fa-flag-checkered', clase: 'btn-success', nombre: 'Finalizar' },
  eliminar: { icono: 'fas fa-trash', clase: 'btn-danger', nombre: 'Eliminar' },
};

const ACCIONES_PRIMARIAS = new Set(['editar', 'habilitar', 'deshabilitar', 'programar', 'eliminar']);
const ACCIONES_VER = new Set(['actas', 'cursos', 'ddjj']);
const ACCIONES_DDJJ = new Set(['ddjj-descargar', 'ddjj-verificar', 'ddjj-eliminar', 'ddjj-recordatorio']);

export function nombreAccion(accion) {
  return DEFINICION[accion]?.nombre || accion;
}

export function BotonAccion({ accion, onClick, disabled = false, entidad, conTexto = false, className = '', title }) {
  const def = DEFINICION[accion];
  if (!def) return null;
  const etiqueta = title || `${def.nombre}${entidad ? ` ${entidad}` : ''}`;
  return (
    <button
      type="button"
      className={`btn btn-sm ${def.clase} btn-accion-icono ${conTexto ? 'btn-accion-con-texto' : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      title={etiqueta}
      aria-label={etiqueta}
    >
      <i className={def.icono} aria-hidden="true" />
      {conTexto && <span className="btn-accion-texto">{def.nombre}</span>}
    </button>
  );
}

function renderGrupo(acciones, entidad, conTexto) {
  return acciones.map((a, i) => (
    <BotonAccion
      key={`${a.accion}-${i}`}
      accion={a.accion}
      onClick={a.onClick}
      disabled={a.disabled}
      entidad={entidad || a.entidad}
      conTexto={conTexto || a.conTexto}
      title={a.titulo}
    />
  ));
}

export default function AccionesCelda({ acciones = [], entidad, conTexto = false, className = '', colSpan }) {
  const ordenadas = [...acciones]
    .filter((a) => a && DEFINICION[a.accion])
    .sort((a, b) => (ORDEN[a.accion] ?? 99) - (ORDEN[b.accion] ?? 99));

  // Separar en grupos
  const primarias = ordenadas.filter((a) => ACCIONES_PRIMARIAS.has(a.accion));
  const ver = ordenadas.filter((a) => ACCIONES_VER.has(a.accion));
  const ddjj = ordenadas.filter((a) => ACCIONES_DDJJ.has(a.accion));
  const otras = ordenadas.filter((a) => !ACCIONES_PRIMARIAS.has(a.accion) && !ACCIONES_VER.has(a.accion) && !ACCIONES_DDJJ.has(a.accion));

  // Detectar si es el caso Docentes (admin) con 10+ acciones
  const esDocentesAdmin = ver.length >= 2 || ddjj.length > 0;

  if (colSpan) {
    return (
      <td colSpan={colSpan} className={`acciones-cell acciones-cell--stack ${className}`.trim()}>
        <div className="acciones-cell-grilla">
          {renderGrupo(ordenadas, entidad, conTexto)}
        </div>
      </td>
    );
  }

  if (esDocentesAdmin) {
    // Layout Docentes Admin: fila principal (4) + fila "ver" expandible
    return (
      <td className={`acciones-cell acciones-cell--docentes ${className}`.trim()}>
        {/* Fila principal: Editar | Estado | Programar | Eliminar */}
        <div className="acciones-fila-principal">
          {renderGrupo(primarias, entidad, conTexto)}
        </div>

        {/* Fila "ver" (colapsable) */}
        {(ver.length > 0 || ddjj.length > 0) && (
          <div className="acciones-fila-ver">
            <details className="acciones-ver-details">
              <summary className="acciones-ver-summary">
                <span className="acciones-ver-label">Ver</span>
                <i className="fas fa-chevron-down" aria-hidden="true" />
              </summary>
              <div className="acciones-ver-content">
                {renderGrupo(ver, entidad, true)}
                {ddjj.length > 0 && (
                  <details className="acciones-ddjj-details">
                    <summary className="acciones-ddjj-summary">
                      <i className="fas fa-file-alt" aria-hidden="true" /> DDJJ
                    </summary>
                    <div className="acciones-ddjj-content">
                      {renderGrupo(ddjj, entidad, conTexto)}
                    </div>
                  </details>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Otras acciones no clasificadas */}
        {otras.length > 0 && (
          <div className="acciones-fila-otras">
            {renderGrupo(otras, entidad, conTexto)}
          </div>
        )}
      </td>
    );
  }

  // Layout estándar para el resto de tablas
  const esSimple = ordenadas.length <= 1;

  return (
    <td className={`acciones-cell ${esSimple ? 'acciones-cell--grid1' : 'acciones-cell--grid2'} ${className}`.trim()}>
      {ordenadas.map((a, i) => (
        <BotonAccion
          key={`${a.accion}-${i}`}
          accion={a.accion}
          onClick={a.onClick}
          disabled={a.disabled}
          entidad={entidad || a.entidad}
          conTexto={conTexto || a.conTexto}
          title={a.titulo}
        />
      ))}
    </td>
  );
}