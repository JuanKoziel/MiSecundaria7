import { Fragment, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getServerTime,
  getLibroTemas,
  createLibroTema,
  updateLibroTema,
  deleteLibroTema,
  uploadFile,
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import confirmarEliminacion from '../../utils/confirmarEliminacion';

const API_BASE = 'http://localhost:8000';

const formVacio = { descripcion: '', archivo: null, ruta_archivo: null };

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.values(data).flat().join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function PanelLibroTemas({ cursoMateriaId, materiaNombre, cursoNombre, miDocente, puedeEditar = true }) {
  const toast = useToast();
  const [registros, setRegistros] = useState([]);
  const [serverInfo, setServerInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [formData, setFormData] = useState(formVacio);
  const [editing, setEditing] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!cursoMateriaId) return;
    try {
      const data = await getLibroTemas({ curso_materia: cursoMateriaId });
      setRegistros(Array.isArray(data) ? data : data.results || []);
    } catch {
      setRegistros([]);
    }
  }, [cursoMateriaId]);

  const cargarServerTime = useCallback(async () => {
    setCargando(true);
    try {
      const info = await getServerTime(cursoMateriaId);
      setServerInfo(info);
    } catch {
      setServerInfo(null);
    } finally {
      setCargando(false);
    }
  }, [cursoMateriaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    cargarServerTime();
  }, [cargarServerTime]);

  const enHorario = serverInfo?.estado?.codigo === 'en_horario';
  const eventoActivo = Boolean(serverInfo?.evento_activo);

  const horarioFinalizado = (reg) => {
    const fechaActual = String(serverInfo?.fecha || '');
    const horaActual = String(serverInfo?.hora || '').slice(0, 5);
    if (!fechaActual || !reg?.fecha) return false;
    const fechaReg = String(reg.fecha);
    if (fechaReg < fechaActual) return true;
    if (fechaReg > fechaActual) return false;
    const horaFin = String(reg.hora_fin || '').slice(0, 5);
    if (!horaActual || !horaFin) return false;
    return horaActual >= horaFin;
  };

  const puedeCrear = enHorario && !eventoActivo && puedeEditar;
  const mostrarFormulario = puedeCrear || Boolean(editing);

  const bloqueActual = useMemo(() => {
    if (!serverInfo?.hora || !Array.isArray(serverInfo.horarios_hoy)) return null;
    const horaActual = String(serverInfo.hora).slice(0, 5);
    for (const h of serverInfo.horarios_hoy) {
      if (h.hora_inicio <= horaActual && horaActual < h.hora_fin) return h;
    }
    return null;
  }, [serverInfo]);

  const fechaActual = serverInfo?.fecha || new Date().toISOString().slice(0, 10);
  const horarioDisplay = bloqueActual
    ? `${bloqueActual.hora_inicio} a ${bloqueActual.hora_fin}`
    : (serverInfo?.estado?.mensaje || '—');

  const docenteDisplay = miDocente ? `${miDocente.apellido}, ${miDocente.nombre}` : '';

  const limpiar = () => {
    setEditing(null);
    setFormData(formVacio);
  };

  const abrirEditar = (registro) => {
    setFormData({
      descripcion: registro.descripcion || '',
      archivo: null,
      ruta_archivo: registro.ruta_archivo || null,
    });
    setEditing(registro);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enHorario || eventoActivo || !puedeEditar) return;
    setGuardando(true);
    try {
      let rutaArchivo = formData.ruta_archivo || null;
      if (formData.archivo) {
        const up = await uploadFile(formData.archivo, 'libro_temas');
        rutaArchivo = up.url || up.ruta_archivo || null;
      }
      const payload = {
        id_curso_materia: cursoMateriaId,
        descripcion: formData.descripcion,
        ruta_archivo: rutaArchivo,
      };
      if (editing) {
        await updateLibroTema(editing.id_libro_tema, payload);
        toast.success('Libro de Temas actualizado correctamente.');
      } else {
        await createLibroTema(payload);
        toast.success('Libro de Temas creado correctamente.');
      }
      limpiar();
      await cargar();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (registro) => {
    await confirmarEliminacion('¿Está seguro de eliminar este registro del Libro de Temas?\n\nEsta acción no se puede deshacer.', {
      onConfirm: async () => {
        try {
          await deleteLibroTema(registro.id_libro_tema);
          toast.success('Libro de Temas eliminado correctamente.');
          await cargar();
        } catch (err) {
          toast.error(mensajeError(err));
        }
      },
    });
  };

  const formularioBloqueado = !enHorario || eventoActivo || !puedeEditar;

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Libro de Temas — {materiaNombre} ({cursoNombre})</h3>
        {!puedeCrear && (
          <span className="badge badge-neutral">Solo lectura</span>
        )}
      </div>

      {!puedeEditar && (
        <p
          style={{
            background: '#fff4cf',
            borderLeft: '4px solid #d97706',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.9rem',
            color: '#854d0e',
            lineHeight: '1.6',
          }}
        >
          <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
          Esta materia está asignada temporalmente a un docente suplente. El Libro de Temas es de solo lectura hasta que finalice la suplencia.
        </p>
      )}

      {eventoActivo && (
        <p
          style={{
            background: '#fff4cf',
            borderLeft: '4px solid #d97706',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.9rem',
            color: '#854d0e',
            lineHeight: '1.6',
          }}
        >
          <i className="fas fa-info-circle" style={{ marginRight: '8px' }} aria-hidden="true" />
          Actualmente hay un evento institucional activo
          {serverInfo?.evento_tipo ? ` (${serverInfo.evento_tipo})` : ''}.
          No se puede cargar el Libro de Temas hasta que finalice el evento.
        </p>
      )}

      {mostrarFormulario && (
        <form onSubmit={handleSubmit}>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="lt-fecha">Fecha</label>
              <input id="lt-fecha" type="date" value={fechaActual} readOnly disabled />
            </div>
            <div className="form-group-filter">
              <label htmlFor="lt-horario">Horario</label>
              <input id="lt-horario" type="text" value={horarioDisplay} readOnly disabled />
            </div>
          </div>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="lt-descripcion">Descripción</label>
              <textarea
                id="lt-descripcion"
                rows={4}
                value={formData.descripcion}
                onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))}
                required
                disabled={formularioBloqueado}
              />
            </div>
          </div>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="lt-archivo">Archivo (opcional)</label>
              <input
                id="lt-archivo"
                type="file"
                onChange={(e) => setFormData((p) => ({ ...p, archivo: e.target.files[0] || null }))}
                disabled={formularioBloqueado}
              />
            </div>
            <div className="form-group-filter flex-row--end">
              {editing && (
                <button type="button" className="btn btn-secondary" onClick={limpiar} disabled={guardando}>
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: 'auto' }}
                disabled={guardando || formularioBloqueado}
              >
                <i className="fas fa-save" aria-hidden="true" />{' '}
                {guardando ? 'Guardando...' : (editing ? 'Actualizar' : 'Cargar Libro de Temas')}
              </button>
            </div>
          </div>
        </form>
      )}

      {!enHorario && serverInfo?.estado?.mensaje && (
        <p
          style={{
            background: '#fff3cd',
            borderLeft: '4px solid #e0a800',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.9rem',
            color: '#856404',
            lineHeight: '1.6',
          }}
        >
          <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
          Modo solo lectura. {serverInfo.estado.mensaje}
        </p>
      )}

      <div className="table-responsive" style={{ marginTop: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Curso</th>
              <th>Materia</th>
              <th>Horario</th>
              <th>Docente</th>
              <th>Descripción</th>
              <th>Archivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state-message">No hay registros del Libro de Temas.</td>
              </tr>
            ) : (
              registros.map((reg) => (
                <Fragment key={reg.id_libro_tema}>
                  <tr>
                    <td>{reg.fecha ? new Date(`${reg.fecha}T00:00:00`).toLocaleDateString() : '—'}</td>
                    <td>{reg.curso_nombre || cursoNombre || '—'}</td>
                    <td>{reg.materia_nombre || materiaNombre || '—'}</td>
                    <td>{`${String(reg.hora_inicio || '').slice(0, 5)} - ${String(reg.hora_fin || '').slice(0, 5)}`}</td>
                    <td>{reg.docente_nombre || docenteDisplay || '—'}</td>
                    <td>{reg.descripcion || '—'}</td>
                    <td>
                      {reg.ruta_archivo ? (
                        <div className="flex-row">
                          <a
                            href={`${API_BASE}${reg.ruta_archivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success table-download-btn"
                          >
                            <i className="fas fa-eye" aria-hidden="true" /> Ver
                          </a>
                          <a
                            href={`${API_BASE}${reg.ruta_archivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="btn btn-sm btn-success"
                            title="Descargar"
                            aria-label="Descargar"
                          >
                            <i className="fas fa-download" aria-hidden="true" />
                          </a>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="acciones-cell flex-row--center">
                      {horarioFinalizado(reg) ? (
                        <span className="badge badge-warning">
                          <i className="fas fa-lock" aria-hidden="true" /> Solo lectura
                        </span>
                      ) : puedeEditar ? (
                        <>
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => abrirEditar(reg)} title="Editar" aria-label="Editar">
                            <i className="fas fa-edit" aria-hidden="true" />
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(reg)} title="Eliminar" aria-label="Eliminar">
                            <i className="fas fa-trash-alt" aria-hidden="true" />
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelLibroTemas;
