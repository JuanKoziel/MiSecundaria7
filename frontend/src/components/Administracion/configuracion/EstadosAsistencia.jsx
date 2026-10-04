import CatalogoConfiguracion from './CatalogoConfiguracion';
import FormModal from '../../Shared/FormModal';
import {
  createEstadoAsistencia,
  deleteEstadoAsistencia,
  getEstadosAsistencia,
  updateEstadoAsistencia,
} from '../../../services/api';

/**
 * Estados de asistencia — Administración → Configuración.
 *
 * El sistema depende de cinco estados con nombre EXACTO (`Presente`, `Ausente`,
 * `Tarde`, `Retirado`, `Justificado`): el registro de asistencias los resuelve
 * por nombre en la lógica del backend. Se garantizan con un seed idempotente
 * (migración `0008_seed_estados_asistencia` y
 * `manage.py seed_estados_asistencia`).
 *
 * Por eso los estados base no se pueden eliminar ni renombrar desde acá: el
 * botón aparece deshabilitado con el motivo, y el backend lo rechaza igual con
 * HTTP 400.
 */
const formVacio = { nombre_estado: '' };

function FormEstado({ formData, setFormData, editing, guardando, onSubmit, onCancel, error, onClearError }) {
  const esBase = Boolean(editing?.es_base);

  return (
    <FormModal
      title={editing ? 'Editar estado de asistencia' : 'Nuevo estado de asistencia'}
      onClose={onCancel}
      error={error}
      onClearError={onClearError}
    >
      <form onSubmit={onSubmit} style={{ position: 'relative' }}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          {esBase && (
            <div className="info-box">
              <i className="fas fa-lock info-box-icon" aria-hidden="true" />
              Este es un estado base del sistema: el registro de asistencias lo reconoce por
              su nombre, por lo que no se puede cambiar ni eliminar.
            </div>
          )}
          <div className="form-group-filter">
            <label htmlFor="estado-nombre">Nombre</label>
            <input
              id="estado-nombre"
              type="text"
              maxLength={50}
              value={formData.nombre_estado}
              onChange={(e) => setFormData((p) => ({ ...p, nombre_estado: e.target.value }))}
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

export default function EstadosAsistencia() {
  return (
    <CatalogoConfiguracion
      singular="Estado de asistencia"
      botonNuevo="Nuevo estado de asistencia"
      modo="eliminar"
      descripcion={
        'Estos estados aparecen al tomar asistencia. Los cinco estados base del sistema ' +
        '(Presente, Ausente, Tarde, Retirado y Justificado) no se pueden eliminar porque ' +
        'el registro de asistencias los reconoce por su nombre exacto.'
      }
      formVacio={formVacio}
      Form={FormEstado}
      itemKey={(e) => e.id_estado_asistencia}
      cargar={() => getEstadosAsistencia()}
      columnas={[
        { clave: 'nombre_estado', etiqueta: 'Estado', valor: (e) => e.nombre_estado },
        {
          clave: 'tipo',
          etiqueta: 'Origen',
          render: (e) =>
            e.es_base ? (
              <span className="badge badge-success">Base del sistema</span>
            ) : (
              <span className="badge badge-danger">Personalizado</span>
            ),
        },
      ]}
      mensajeVacio="No hay estados de asistencia registrados."
      noEditable={(e) => Boolean(e.es_base)}
      sinEliminar={(e) =>
        e.es_base
          ? 'Es un estado base del sistema: no se puede eliminar.'
          : null
      }
      toFormData={(e) => ({ nombre_estado: e.nombre_estado || '' })}
      toPayload={(f) => ({ nombre_estado: f.nombre_estado })}
      alGuardar={async (item, payload) => {
        if (payload?.__eliminar) return deleteEstadoAsistencia(item.id_estado_asistencia);
        if (item) return updateEstadoAsistencia(item.id_estado_asistencia, payload);
        return createEstadoAsistencia(payload);
      }}
    />
  );
}