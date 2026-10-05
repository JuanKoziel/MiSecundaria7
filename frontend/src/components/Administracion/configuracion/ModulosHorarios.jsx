import CatalogoConfiguracion from './CatalogoConfiguracion';
import FormModal from '../../Shared/FormModal';
import {
  createModulo,
  deleteModulo,
  getModulos,
  updateModulo,
} from '../../../services/api';

/**
 * Módulos horarios — Administración → Configuración.
 *
 * `modulos` no tiene columna `estado`: el borrado es físico. Como
 * `horarios.id_modulo` es RESTRICT, el backend impide eliminar un módulo que
 * tenga horarios asignados y responde HTTP 400 con el detalle, en vez de dejar
 * que la FK reviente con un 500.
 */
const formVacio = { nombre: '', hora_inicio: '', hora_fin: '' };

function FormModulo({ formData, setFormData, editing, guardando, onSubmit, onCancel, error, onClearError }) {
  return (
    <FormModal
      title={editing ? 'Editar módulo horario' : 'Nuevo módulo horario'}
      onClose={onCancel}
      error={error}
      onClearError={onClearError}
    >
      <form onSubmit={onSubmit} style={{ position: 'relative' }}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="form-group-filter">
            <label htmlFor="modulo-nombre">Nombre</label>
            <input
              id="modulo-nombre"
              type="text"
              placeholder="Módulo 1"
              maxLength={50}
              value={formData.nombre}
              onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
              required
            />
          </div>
          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              <label htmlFor="modulo-inicio">Hora de inicio</label>
              <input
                id="modulo-inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData((p) => ({ ...p, hora_inicio: e.target.value }))}
                required
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="modulo-fin">Hora de fin</label>
              <input
                id="modulo-fin"
                type="time"
                value={formData.hora_fin}
                onChange={(e) => setFormData((p) => ({ ...p, hora_fin: e.target.value }))}
                required
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

export default function ModulosHorarios() {
  return (
    <CatalogoConfiguracion
      singular="Módulo horario"
      botonNuevo="Nuevo módulo horario"
      modo="eliminar"
      descripcion={
        'Los módulos son franjas horarias (por ejemplo, "Módulo 1" de 07:30 a 08:10) ' +
        'que se usan para armar la grilla de horarios. Un módulo asignado a horarios ' +
        'no se puede eliminar.'
      }
      formVacio={formVacio}
      Form={FormModulo}
      itemKey={(m) => m.id_modulo}
      cargar={() => getModulos()}
      columnas={[
        { clave: 'nombre', etiqueta: 'Nombre', valor: (m) => m.nombre },
        {
          clave: 'horario',
          etiqueta: 'Horario',
          render: (m) => `${String(m.hora_inicio || '').slice(0, 5)} - ${String(m.hora_fin || '').slice(0, 5)}`,
        },
      ]}
      mensajeVacio="No hay módulos horarios registrados."
      toFormData={(m) => ({
        nombre: m.nombre || '',
        hora_inicio: String(m.hora_inicio || '').slice(0, 5),
        hora_fin: String(m.hora_fin || '').slice(0, 5),
      })}
      toPayload={(f) => ({
        nombre: f.nombre,
        hora_inicio: f.hora_inicio,
        hora_fin: f.hora_fin,
      })}
      alGuardar={async (item, payload) => {
        if (payload?.__eliminar) return deleteModulo(item.id_modulo);
        if (item) return updateModulo(item.id_modulo, payload);
        return createModulo(payload);
      }}
    />
  );
}