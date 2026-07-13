import { useCallback, useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { getDocentes, createCursoMateria, updateCursoMateria } from '../../services/api';
import FormModal from '../../components/Shared/FormModal';

const formVacio = { id_materia: '', id_docente: '' };

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.values(data).flat().join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function AsignacionMaterias() {
  const { adminCursoMateria, refreshAdminCursoMateria, adminCursos, refreshAdminCursos, adminMaterias, refreshAdminMaterias } = useData();
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [docentes, setDocentes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    refreshAdminCursos(false);
    refreshAdminMaterias(false);
    getDocentes().then((r) => setDocentes(Array.isArray(r) ? r : [])).catch(() => {});
  }, [refreshAdminCursos, refreshAdminMaterias]);

  const cargarAsignaciones = useCallback(() => {
    if (cursoSeleccionado) refreshAdminCursoMateria(Number(cursoSeleccionado), mostrarInactivos);
  }, [cursoSeleccionado, mostrarInactivos, refreshAdminCursoMateria]);

  useEffect(() => { cargarAsignaciones(); }, [cargarAsignaciones]);

  const cursoObj = adminCursos.find((c) => Number(c.id_curso) === Number(cursoSeleccionado));

  const asignacionesCurso = cursoSeleccionado
    ? adminCursoMateria.filter((cm) => cm.id_curso === Number(cursoSeleccionado))
    : [];

  const materiasAsignadasIds = asignacionesCurso.filter((cm) => cm.activo).map((cm) => cm.id_materia);

  const abrirAgregar = () => {
    setEditando(null);
    setFormData(formVacio);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const abrirEditarDocente = (cm) => {
    setEditando(cm);
    setFormData({ id_materia: cm.id_materia, id_docente: cm.id_docente ?? '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const cerrarFormulario = () => {
    setShowModal(false);
    setEditando(null);
    setFormData(formVacio);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGuardando(true);
    try {
      const payload = {
        id_curso: Number(cursoSeleccionado),
        id_materia: Number(formData.id_materia),
        id_docente: formData.id_docente ? Number(formData.id_docente) : null,
      };
      if (editando) {
        await updateCursoMateria(editando.id_curso_materia, payload);
        setSuccess('Docente actualizado correctamente');
      } else {
        await createCursoMateria(payload);
        setSuccess('Materia asignada correctamente');
      }
      cerrarFormulario();
      cargarAsignaciones();
    } catch (err) {
      setError(`Error al guardar: ${mensajeError(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = async (cm) => {
    if (!window.confirm('La materia dejará de estar asignada a este curso.\n\nNo se eliminará ningún historial existente.\n\n¿Desea continuar?')) return;
    setError('');
    setSuccess('');
    try {
      await updateCursoMateria(cm.id_curso_materia, { activo: false });
      setSuccess('Asignación desactivada correctamente');
      cargarAsignaciones();
    } catch (err) {
      setError(`Error al quitar: ${mensajeError(err)}`);
    }
  };

  const nombreMateria = (id_materia) => {
    const m = adminMaterias.find((x) => Number(x.id_materia) === Number(id_materia));
    return m ? m.nombre_materia : '—';
  };

  const nombreDocente = (id_docente) => {
    if (!id_docente) return '—';
    const d = docentes.find((x) => Number(x.id_docente) === Number(id_docente));
    return d ? `${d.apellido}, ${d.nombre}` : '—';
  };

  return (
    <div className="card">
      <div className="card-header"><h2>Asignación de Materias a Cursos</h2></div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group-filter" style={{ flex: 1 }}>
            <label htmlFor="asig-curso">Curso</label>
            <select id="asig-curso" value={cursoSeleccionado} onChange={(e) => { setCursoSeleccionado(e.target.value); setShowModal(false); }}>
              <option value="">Seleccionar curso...</option>
              {adminCursos.filter((c) => c.activo).map((c) => (
                <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso} {c.ciclo_anio ? `(${c.ciclo_anio})` : ''}</option>
              ))}
            </select>
          </div>
          <label style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} style={{ marginRight: '8px' }} />
            Mostrar registros inactivos
          </label>
        </div>

        {cursoSeleccionado && (
          <div>
            <div className="flex-row--end mb-16">
              <button type="button" className="btn btn-primary" onClick={abrirAgregar}>
                <i className="fas fa-plus" aria-hidden="true" /> Agregar Materia
              </button>
            </div>

            {showModal && (
              <FormModal
                title={editando ? 'Editar Docente' : ('Agregar Materia' + (cursoObj ? ` — ${cursoObj.nombre_curso}` : ''))}
                onClose={cerrarFormulario}
              >
                <form onSubmit={handleSubmit}>
                  <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
                    <div className="preceptor-form-row preceptor-form-row--two">
                      {!editando && (
                        <div className="form-group-filter">
                          <label htmlFor="asig-materia">Materia</label>
                          <select id="asig-materia" value={formData.id_materia} onChange={(e) => setFormData((p) => ({ ...p, id_materia: e.target.value }))} required>
                            <option value="">Seleccionar...</option>
                            {adminMaterias.filter((m) => m.activo).map((m) => (
                              <option key={m.id_materia} value={m.id_materia}>
                                {m.nombre_materia} {materiasAsignadasIds.includes(m.id_materia) ? '(ya asignada)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="form-group-filter">
                        <label htmlFor="asig-docente">Docente</label>
                        <select id="asig-docente" value={formData.id_docente} onChange={(e) => setFormData((p) => ({ ...p, id_docente: e.target.value }))}>
                          <option value="">— Sin asignar —</option>
                          {docentes.map((d) => (
                            <option key={d.id_docente} value={d.id_docente}>{d.apellido}, {d.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="standard-modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={cerrarFormulario}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                      {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Asignar')}
                    </button>
                  </div>
                </form>
              </FormModal>
            )}

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Docente</th>
                    <th>Horarios asignados</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignacionesCurso.length === 0 ? (
                    <tr><td colSpan={5} className="empty-state-message">No hay materias asignadas a este curso.</td></tr>
                  ) : (
                    asignacionesCurso.map((cm) => (
                      <tr key={cm.id}>
                        <td>{nombreMateria(cm.id_materia)}</td>
                        <td>{nombreDocente(cm.id_docente)}</td>
                        <td>{cm.horarios_count ?? 0}</td>
                        <td>
                          <span className={`badge ${cm.activo ? 'badge-success' : 'badge-danger'}`}>
                            {cm.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="acciones-cell flex-row--center">
                          {cm.activo ? (
                            <div>
                              <button type="button" className="btn btn-sm btn-secondary" onClick={() => abrirEditarDocente(cm)} aria-label="Editar docente" title="Cambiar docente">
                                <i className="fas fa-user-edit" aria-hidden="true" />
                              </button>
                              <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDesactivar(cm)} aria-label="Quitar materia" title="Quitar materia del curso">
                                <i className="fas fa-ban" aria-hidden="true" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85em' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!cursoSeleccionado && (
          <div className="empty-state-message">Seleccione un curso para ver sus materias asignadas.</div>
        )}
      </div>
    </div>
  );
}

export default AsignacionMaterias;
