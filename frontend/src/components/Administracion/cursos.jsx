import { Fragment, useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { createCurso, updateCurso } from '../../services/api';
import FormModal from '../../components/Shared/FormModal';
import confirmarEliminacion from '../../utils/confirmarEliminacion';

const formVacio = {
  anio: '',
  division: '',
  orientacion: '',
  id_preceptor: '',
  id_ciclo: '',
};

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.values(data).flat().join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function FormCurso({ formData, setFormData, editing, guardando, onSubmit, onCancel, ciclosLectivos, preceptores }) {
  return (
    <FormModal title={editing ? 'Editar curso' : 'Nuevo curso'} onClose={onCancel}>
      <form onSubmit={onSubmit}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              <label htmlFor="curso-anio">Año</label>
              <input id="curso-anio" type="number" min="1" max="7" value={formData.anio} onChange={(e) => setFormData((p) => ({ ...p, anio: e.target.value }))} required />
            </div>
            <div className="form-group-filter">
              <label htmlFor="curso-division">División</label>
              <input id="curso-division" type="number" min="1" max="20" value={formData.division} onChange={(e) => setFormData((p) => ({ ...p, division: e.target.value }))} required />
            </div>
          </div>
          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              <label htmlFor="curso-orientacion">Orientación</label>
              <input id="curso-orientacion" type="text" value={formData.orientacion} onChange={(e) => setFormData((p) => ({ ...p, orientacion: e.target.value }))} />
            </div>
            <div className="form-group-filter">
              <label htmlFor="curso-preceptor">Preceptor</label>
              <select id="curso-preceptor" value={formData.id_preceptor} onChange={(e) => setFormData((p) => ({ ...p, id_preceptor: e.target.value }))}>
                <option value="">— Sin asignar —</option>
                {(preceptores || []).map((p) => (
                  <option key={p.id_preceptor} value={p.id_preceptor}>{p.apellido}, {p.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="preceptor-form-row">
            <div className="form-group-filter">
              <label htmlFor="curso-ciclo">Ciclo lectivo</label>
              <select id="curso-ciclo" value={formData.id_ciclo} onChange={(e) => setFormData((p) => ({ ...p, id_ciclo: e.target.value }))} required>
                <option value="">Seleccionar...</option>
                {(ciclosLectivos || []).map((c) => (
                  <option key={c.id_ciclo} value={c.id_ciclo}>{c.anio}</option>
                ))}
              </select>
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

function Cursos() {
  const { adminCursos, refreshAdminCursos, ciclosLectivos, preceptores } = useData();
  const toast = useToast();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    refreshAdminCursos(mostrarInactivos);
  }, [mostrarInactivos, refreshAdminCursos]);

  const parsearNombreCurso = (nombre) => {
    if (!nombre || !nombre.includes('°')) return { anio: '', division: '' };
    const parts = nombre.split('°');
    return { anio: parts[0] || '', division: parts.length > 1 ? parts[1] : '' };
  };

  const limpiar = () => {
    setShowNewForm(false);
    setEditing(null);
    setFormData(formVacio);
    setError('');
    setSuccess('');
  };

  const abrirNuevo = () => {
    limpiar();
    setShowNewForm(true);
  };

  const abrirEditar = (curso) => {
    limpiar();
    const { anio, division } = parsearNombreCurso(curso.nombre_curso);
    setEditing(curso);
    setFormData({
      anio,
      division,
      orientacion: curso.orientacion || '',
      id_preceptor: curso.id_preceptor ?? '',
      id_ciclo: curso.id_ciclo ?? '',
    });
  };

  const construirNombreCurso = (anio, division) => `${anio}°${division}`;

  const handleSubmit = async (e, esEdicion) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGuardando(true);
    try {
      const payload = {
        nombre_curso: construirNombreCurso(formData.anio, formData.division),
        orientacion: formData.orientacion || null,
        id_preceptor: formData.id_preceptor ? Number(formData.id_preceptor) : null,
        id_ciclo: formData.id_ciclo ? Number(formData.id_ciclo) : null,
      };
      if (esEdicion) {
        await updateCurso(editing.id_curso, payload);
        toast.success('Curso actualizado correctamente.');
      } else {
        await createCurso(payload);
        toast.success('Curso creado correctamente.');
      }
      limpiar();
      await refreshAdminCursos(mostrarInactivos);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = async (curso) => {
    if (!confirmarEliminacion(
      'Este curso dejará de estar disponible para nuevas operaciones.\n\n' +
      'No se eliminará ningún dato histórico.\n\n' +
      'Se conservarán:\n' +
      '• alumnos\n• horarios\n• actividades\n• asistencias\n' +
      '• calificaciones\n• planificaciones\n• comunicaciones\n\n' +
      '¿Desea continuar?'
    )) return;
    setError('');
    setSuccess('');
    try {
      await updateCurso(curso.id_curso, { activo: false });
      toast.success('Curso desactivado correctamente.');
      await refreshAdminCursos(mostrarInactivos);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const cursoNombre = (curso) => curso.nombre_curso || '';

  return (
    <div className="card">
      <div className="card-header">
        <h2>Gestión de Cursos</h2>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="flex-row--between mb-16">
          <label style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} style={{ marginRight: '8px' }} />
            Mostrar registros inactivos
          </label>
          <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
            <i className="fas fa-plus" aria-hidden="true" /> Nuevo Curso
          </button>
        </div>

        {showNewForm && (
          <FormCurso
            formData={formData}
            setFormData={setFormData}
            editing={null}
            guardando={guardando}
            onSubmit={(e) => handleSubmit(e, false)}
            onCancel={limpiar}
            ciclosLectivos={ciclosLectivos}
            preceptores={preceptores}
          />
        )}

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Orientación</th>
                <th>Preceptor</th>
                <th>Ciclo Lectivo</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {adminCursos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-message">No hay cursos registrados.</td>
                </tr>
              ) : (
                adminCursos.map((c) => (
                  <Fragment key={c.id_curso}>
                    <tr>
                      <td>{cursoNombre(c)}</td>
                      <td>{c.orientacion || '---'}</td>
                      <td>{c.preceptor_nombre || '---'}</td>
                      <td>{c.ciclo_anio || '---'}</td>
                      <td>
                        <span className={`badge ${c.activo ? 'badge-success' : 'badge-danger'}`}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="acciones-cell flex-row--center">
                        {c.activo && (
                          <div>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => abrirEditar(c)} aria-label="Editar curso" title="Editar">
                              <i className="fas fa-edit" aria-hidden="true" />
                            </button>
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDesactivar(c)} aria-label="Desactivar curso" title="Desactivar">
                              <i className="fas fa-ban" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {editing && (
          <FormCurso
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            guardando={guardando}
            onSubmit={(e) => handleSubmit(e, true)}
            onCancel={limpiar}
            ciclosLectivos={ciclosLectivos}
            preceptores={preceptores}
          />
        )}
      </div>
    </div>
  );
}

export default Cursos;
