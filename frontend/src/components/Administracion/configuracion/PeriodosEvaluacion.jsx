import CatalogoConfiguracion from './CatalogoConfiguracion';
import FormModal from '../../Shared/FormModal';
import {
  createPeriodo,
  deletePeriodo,
  getPeriodos,
  updatePeriodo,
} from '../../../services/api';

/**
 * Períodos de evaluación — Administración → Configuración.
 *
 * `orden_periodo` define la posición del período en el consolidado de
 * calificaciones (orden 1 = primer cuatrimestre, orden 2 = segundo), así que no
 * puede repetirse entre períodos activos. Un período con calificaciones
 * cargadas no se puede desactivar: el backend responde HTTP 400.
 */
const formVacio = { nombre_periodo: '', orden_periodo: '' };

function FormPeriodo({ formData, setFormData, editing, guardando, onSubmit, onCancel, error, onClearError }) {
  return (
    <FormModal
      title={editing ? 'Editar período de evaluación' : 'Nuevo período de evaluación'}
      onClose={onCancel}
      error={error}
      onClearError={onClearError}
    >
      <form onSubmit={onSubmit} style={{ position: 'relative' }}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="form-group-filter">
            <label htmlFor="periodo-nombre">Nombre</label>
            <input
              id="periodo-nombre"
              type="text"
              placeholder="1er Cuatrimestre"
              maxLength={100}
              value={formData.nombre_periodo}
              onChange={(e) => setFormData((p) => ({ ...p, nombre_periodo: e.target.value }))}
              required
            />
          </div>
          <div className="form-group-filter">
            <label htmlFor="periodo-orden">Orden</label>
            <input
              id="periodo-orden"
              type="number"
              min="1"
              step="1"
              placeholder="1"
              value={formData.orden_periodo}
              onChange={(e) => setFormData((p) => ({ ...p, orden_periodo: e.target.value }))}
              required
            />
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

export default function PeriodosEvaluacion() {
  return (
    <CatalogoConfiguracion
      singular="Período de evaluación"
      botonNuevo="Nuevo período de evaluación"
      modo="desactivar"
      permiteInactivos
      descripcion={
        'El orden indica la posición del período en el consolidado: 1 = primer ' +
        'cuatrimestre y 2 = segundo. No puede haber dos períodos activos con el mismo orden. ' +
        'Los períodos se desactivan, no se eliminan.'
      }
      formVacio={formVacio}
      Form={FormPeriodo}
      itemKey={(p) => p.id_periodo}
      cargar={(incluirInactivos) =>
        getPeriodos(incluirInactivos ? { incluir_inactivos: 1 } : undefined)
      }
      columnas={[
        { clave: 'nombre_periodo', etiqueta: 'Período', valor: (p) => p.nombre_periodo },
        { clave: 'orden_periodo', etiqueta: 'Orden', valor: (p) => p.orden_periodo },
        {
          clave: 'estado',
          etiqueta: 'Estado',
          render: (p, activo) => (
            <span className={`badge ${activo ? 'badge-success' : 'badge-danger'}`}>
              {activo ? 'Activo' : 'Inactivo'}
            </span>
          ),
        },
      ]}
      mensajeVacio="No hay períodos de evaluación registrados."
      mensajeSinInactivos="No hay períodos de evaluación inactivos."
      toFormData={(p) => ({
        nombre_periodo: p.nombre_periodo || '',
        orden_periodo: p.orden_periodo ?? '',
      })}
      toPayload={(f) => ({
        nombre_periodo: f.nombre_periodo,
        orden_periodo: f.orden_periodo === '' ? null : Number(f.orden_periodo),
      })}
      alGuardar={async (item, payload) => {
        if (payload?.__desactivar) return deletePeriodo(item.id_periodo);
        if (payload?.__reactivar) return updatePeriodo(item.id_periodo, { estado: true });
        if (payload?.__eliminar) return deletePeriodo(item.id_periodo);
        if (item) return updatePeriodo(item.id_periodo, payload);
        return createPeriodo(payload);
      }}
      mensajeDesactivar={(p) =>
        `El período "${p.nombre_periodo}" dejará de estar disponible para nuevas calificaciones.\n\n` +
        'No se eliminará ninguna calificación.\n\n' +
        'Podés reactivarlo en cualquier momento.\n\n' +
        '¿Desea continuar?'
      }
    />
  );
}