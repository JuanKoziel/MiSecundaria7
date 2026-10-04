import CatalogoConfiguracion from './CatalogoConfiguracion';
import FormModal from '../../Shared/FormModal';
import {
  createTipoActa,
  deleteTipoActa,
  getTiposActa,
  updateTipoActa,
} from '../../../services/api';

/**
 * Tipos de acta — Administración → Configuración.
 *
 * Borrado físico: un tipo con actas asociadas no se puede eliminar (el backend
 * responde HTTP 400 con el detalle en vez de romper la FK).
 */
const formVacio = { nombre_tipo: '' };

function FormTipoActa({ formData, setFormData, editing, guardando, onSubmit, onCancel, error, onClearError }) {
  return (
    <FormModal
      title={editing ? 'Editar tipo de acta' : 'Nuevo tipo de acta'}
      onClose={onCancel}
      error={error}
      onClearError={onClearError}
    >
      <form onSubmit={onSubmit} style={{ position: 'relative' }}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="form-group-filter">
            <label htmlFor="tipo-acta-nombre">Nombre</label>
            <input
              id="tipo-acta-nombre"
              type="text"
              maxLength={50}
              placeholder="Acta de evaluación"
              value={formData.nombre_tipo}
              onChange={(e) => setFormData((p) => ({ ...p, nombre_tipo: e.target.value }))}
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

export default function TiposActa() {
  return (
    <CatalogoConfiguracion
      singular="Tipo de acta"
      botonNuevo="Nuevo tipo de acta"
      modo="eliminar"
      descripcion={
        'Clasifican las actas que se cargan (informe parcial, acta de evaluación, etc.). ' +
        'Un tipo con actas asociadas no se puede eliminar.'
      }
      formVacio={formVacio}
      Form={FormTipoActa}
      itemKey={(t) => t.id_tipo_acta}
      cargar={() => getTiposActa()}
      columnas={[
        { clave: 'nombre_tipo', etiqueta: 'Tipo de acta', valor: (t) => t.nombre_tipo },
      ]}
      mensajeVacio="No hay tipos de acta registrados."
      toFormData={(t) => ({ nombre_tipo: t.nombre_tipo || '' })}
      toPayload={(f) => ({ nombre_tipo: f.nombre_tipo })}
      alGuardar={async (item, payload) => {
        if (payload?.__eliminar) return deleteTipoActa(item.id_tipo_acta);
        if (item) return updateTipoActa(item.id_tipo_acta, payload);
        return createTipoActa(payload);
      }}
    />
  );
}