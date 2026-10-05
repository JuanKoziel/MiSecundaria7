import CatalogoConfiguracion from './CatalogoConfiguracion';
import FormModal from '../../Shared/FormModal';
import {
  createCicloLectivo,
  deleteCicloLectivo,
  getCiclosLectivos,
  updateCicloLectivo,
} from '../../../services/api';

/**
 * Ciclos lectivos — Administración → Configuración.
 *
 * Un ciclo lectivo no se borra nunca: se DESACTIVA (borrado lógico) y se
 * reactiva con `updateCicloLectivo(id, { estado: true })`. Desactivarlo no
 * elimina cursos ni historial; si el ciclo tiene cursos activos o alcances de
 * comunicados, el backend responde HTTP 400 con el detalle de qué lo bloquea.
 */
const formVacio = { anio: '', fecha_inicio: '', fecha_fin: '' };

// El rango es el de la columna física `YEAR(4)` de MariaDB (1901..2155): el
// backend rechaza lo que caiga fuera con un HTTP 400 explicativo.
function soloAnio(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1901 && n <= 2155;
}

function FormCicloLectivo({ formData, setFormData, editing, guardando, onSubmit, onCancel, error, onClearError }) {
  return (
    <FormModal
      title={editing ? 'Editar ciclo lectivo' : 'Nuevo ciclo lectivo'}
      onClose={onCancel}
      error={error}
      onClearError={onClearError}
    >
      <form onSubmit={onSubmit} style={{ position: 'relative' }}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="form-group-filter">
            <label htmlFor="ciclo-anio">Año</label>
            <input
              id="ciclo-anio"
              type="number"
              min="1901"
              max="2155"
              step="1"
              placeholder="2026"
              value={formData.anio}
              onChange={(e) => setFormData((p) => ({ ...p, anio: e.target.value }))}
              required
            />
          </div>
          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              <label htmlFor="ciclo-inicio">Fecha de inicio</label>
              <input
                id="ciclo-inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData((p) => ({ ...p, fecha_inicio: e.target.value }))}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="ciclo-fin">Fecha de fin</label>
              <input
                id="ciclo-fin"
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => setFormData((p) => ({ ...p, fecha_fin: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="standard-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

export default function CiclosLectivos() {
  return (
    <CatalogoConfiguracion
      singular="Ciclo lectivo"
      botonNuevo="Nuevo ciclo lectivo"
      modo="desactivar"
      permiteInactivos
      descripcion={
        'Los ciclos lectivos se desactivan, no se eliminan: los cursos y el historial ' +
        'del ciclo quedan intactos. Un ciclo con cursos activos no se puede desactivar.'
      }
      formVacio={formVacio}
      Form={FormCicloLectivo}
      itemKey={(c) => c.id_ciclo}
      cargar={(incluirInactivos) =>
        getCiclosLectivos(incluirInactivos ? { incluir_inactivos: 1 } : undefined)
      }
      columnas={[
        {
          clave: 'id_ciclo',
          etiqueta: 'Año',
          valor: (c) => c.anio,
        },
        {
          clave: 'fechas',
          etiqueta: 'Período',
          render: (c) =>
            c.fecha_inicio || c.fecha_fin
              ? `${c.fecha_inicio || '—'} — ${c.fecha_fin || '—'}`
              : 'Sin fechas',
        },
        {
          clave: 'estado',
          etiqueta: 'Estado',
          render: (c, activo) => (
            <span className={`badge ${activo ? 'badge-success' : 'badge-danger'}`}>
              {activo ? 'Activo' : 'Inactivo'}
            </span>
          ),
        },
      ]}
      mensajeVacio="No hay ciclos lectivos registrados."
      mensajeSinInactivos="No hay ciclos lectivos inactivos."
      toFormData={(c) => ({
        anio: String(c.anio ?? ''),
        fecha_inicio: c.fecha_inicio || '',
        fecha_fin: c.fecha_fin || '',
      })}
      toPayload={(f) => ({
        anio: soloAnio(f.anio) ? Number(f.anio) : f.anio,
        fecha_inicio: f.fecha_inicio || null,
        fecha_fin: f.fecha_fin || null,
      })}
      alGuardar={async (item, payload) => {
        if (payload?.__desactivar) return deleteCicloLectivo(item.id_ciclo);
        if (payload?.__reactivar) return updateCicloLectivo(item.id_ciclo, { estado: true });
        if (payload?.__eliminar) return deleteCicloLectivo(item.id_ciclo);
        if (item) return updateCicloLectivo(item.id_ciclo, payload);
        return createCicloLectivo(payload);
      }}
      mensajeDesactivar={(c) =>
        `El ciclo lectivo ${c.anio} dejará de estar disponible para nuevos cursos.\n\n` +
        'No se eliminará ningún dato histórico.\n\n' +
        'Se conservarán:\n' +
        '• cursos\n• estudiantes\n• calificaciones\n• asistencias\n' +
        '• horarios\n• comunicados\n\n' +
        'Podés reactivarlo en cualquier momento.\n\n' +
        '¿Desea continuar?'
      }
    />
  );
}