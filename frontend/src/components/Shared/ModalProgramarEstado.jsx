import { useEffect, useState } from 'react';
import FormModal from './FormModal';

function formatearFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

function aInputDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Programación de habilitación / deshabilitación de una cuenta (punto 6.2).
 *
 * El backend ya expone `fecha_deshabilitacion_programada` y
 * `fecha_habilitacion_programada` y las aplica con
 * `escuela.usuario_estado.aplicar_programaciones_usuario` (middleware) cuando
 * llega la fecha. Este modal es el patrón único para agendar, consultar lo
 * pendiente y cancelar. Cancelar es enviar `null` en el campo correspondiente.
 */
export default function ModalProgramarEstado({
  abierto,
  persona,
  estadoActual,
  fechaDeshabilitacion,
  fechaHabilitacion,
  guardando,
  onCerrar,
  onGuardar,
  onCancelarProgramacion,
}) {
  const [form, setForm] = useState({ fecha_deshabilitacion_programada: '', fecha_habilitacion_programada: '' });

  useEffect(() => {
    if (!abierto) return;
    setForm({
      fecha_deshabilitacion_programada: aInputDateTime(fechaDeshabilitacion),
      fecha_habilitacion_programada: aInputDateTime(fechaHabilitacion),
    });
  }, [abierto, fechaDeshabilitacion, fechaHabilitacion]);

  if (!abierto || !persona) return null;

  const pendientes = [
    fechaDeshabilitacion ? { tipo: 'Deshabilitar', campo: 'fecha_deshabilitacion_programada', fecha: fechaDeshabilitacion } : null,
    fechaHabilitacion ? { tipo: 'Habilitar', campo: 'fecha_habilitacion_programada', fecha: fechaHabilitacion } : null,
  ].filter(Boolean);

  const proxima = pendientes.length ? pendientes[0] : null;

  return (
    <FormModal
      title={`Programar estado: ${persona.apellido}, ${persona.nombre}`}
      onClose={onCerrar}
      cerrarConEscape={!guardando}
    >
      <form
        className="preceptor-form"
        onSubmit={(e) => {
          e.preventDefault();
          onGuardar({
            fecha_deshabilitacion_programada: form.fecha_deshabilitacion_programada || null,
            fecha_habilitacion_programada: form.fecha_habilitacion_programada || null,
          });
        }}
      >
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <p className="m-0" style={{ color: '#cbd5e1', lineHeight: '1.5' }}>
            La cuenta está <strong>{estadoActual ? 'habilitada' : 'deshabilitada'}</strong>. Definí las fechas
            para que el cambio se aplique solo. Mientras haya una programación pendiente, el estado real del
            usuario no cambia.
          </p>

          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              <label htmlFor="prog-deshabilitacion">Deshabilitación programada</label>
              <input
                id="prog-deshabilitacion"
                type="datetime-local"
                value={form.fecha_deshabilitacion_programada}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fecha_deshabilitacion_programada: e.target.value }))
                }
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="prog-habilitacion">Habilitación programada</label>
              <input
                id="prog-habilitacion"
                type="datetime-local"
                value={form.fecha_habilitacion_programada}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_habilitacion_programada: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group-filter">
            <span style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              Programaciones registradas
            </span>
            {pendientes.length === 0 ? (
              <p className="empty-state-message m-0" style={{ padding: '12px', margin: 0 }}>
                No hay programaciones pendientes para esta cuenta.
              </p>
            ) : (
              <ul className="programacion-lista">
                {pendientes.map((p) => (
                  <li key={p.campo}>
                    <span>
                      <strong>{p.tipo}</strong> el {formatearFecha(p.fecha)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => onCancelarProgramacion(p.campo)}
                      disabled={guardando}
                      aria-label={`Cancelar la programación de ${p.tipo.toLowerCase()}`}
                    >
                      <i className="fas fa-xmark" aria-hidden="true" /> Cancelar programación
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {proxima && (
              <p className="proxima-accion-hint" role="status">
                Próxima acción: {proxima.tipo} el {formatearFecha(proxima.fecha)}
              </p>
            )}
          </div>
        </div>
        <div className="standard-modal-footer">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <i className="fas fa-save" aria-hidden="true" />{' '}
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </form>
    </FormModal>
  );
}
