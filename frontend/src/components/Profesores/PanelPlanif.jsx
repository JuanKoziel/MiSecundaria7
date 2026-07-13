import { Fragment, useState, useEffect, useCallback } from 'react';
import { getPlanificaciones, createPlanificacion, updatePlanificacion, deletePlanificacion } from '../../services/api';
import { useData } from '../../context/DataContext';
import FormModal from '../../components/Shared/FormModal';

const API_BASE = 'http://localhost:8000';

const formVacio = { contenido: '', objetivos: '', salidas: '', fundamentacion: '' };

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.values(data).flat().join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function FormProyecto({ formData, setFormData, editing, guardando, onSubmit, onCancel }) {
  return (
    <FormModal title={editing ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={onCancel}>
      <form onSubmit={onSubmit}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              <label htmlFor="proy-contenido">Contenido</label>
              <textarea
                id="proy-contenido"
                rows={5}
                value={formData.contenido}
                onChange={(e) => setFormData((p) => ({ ...p, contenido: e.target.value }))}
                required
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="proy-objetivos">Objetivos</label>
              <textarea
                id="proy-objetivos"
                rows={5}
                value={formData.objetivos}
                onChange={(e) => setFormData((p) => ({ ...p, objetivos: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              <label htmlFor="proy-salidas">Salidas educativas</label>
              <textarea
                id="proy-salidas"
                rows={5}
                value={formData.salidas}
                onChange={(e) => setFormData((p) => ({ ...p, salidas: e.target.value }))}
                required
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="proy-fundamentacion">Fundamentación</label>
              <textarea
                id="proy-fundamentacion"
                rows={5}
                value={formData.fundamentacion}
                onChange={(e) => setFormData((p) => ({ ...p, fundamentacion: e.target.value }))}
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

function PanelPlanif({ cursoMateriaId, docenteId, materiaNombre, cursoNombre, miDocente }) {
  const { refreshData } = useData();
  const [proyectos, setProyectos] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!cursoMateriaId) return;
    try {
      const data = await getPlanificaciones({ curso_materia: cursoMateriaId });
      const items = Array.isArray(data) ? data : data.results || [];
      setProyectos(items);
    } catch {
      setProyectos([]);
    }
  }, [cursoMateriaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const parsearDescripcion = (p) => {
    try {
      const obj = JSON.parse(p.descripcion || '{}');
      return {
        contenido: obj.contenido || '',
        objetivos: obj.objetivos || '',
        salidas: obj.salidas || '',
        fundamentacion: obj.fundamentacion || '',
      };
    } catch {
      return { contenido: '', objetivos: '', salidas: '', fundamentacion: '' };
    }
  };

  const limpiar = () => {
    setShowNewForm(false);
    setEditing(null);
    setFormData(formVacio);
    setError('');
    setSuccess('');
  };

  const abrirNuevo = () => {
    if (showNewForm) {
      limpiar();
    } else {
      limpiar();
      setShowNewForm(true);
    }
  };

  const abrirEditar = (proyecto) => {
    limpiar();
    setEditing(proyecto);
    setFormData(parsearDescripcion(proyecto));
  };

  const handleSubmit = async (e, esEdicion) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGuardando(true);
    try {
      const payload = {
        id_docente: docenteId,
        id_curso_materia: cursoMateriaId,
        contenido: formData.contenido,
        objetivos: formData.objetivos,
        salidas: formData.salidas,
        fundamentacion: formData.fundamentacion,
      };
      if (esEdicion) {
        await updatePlanificacion(editing.id_planificacion, payload);
        setSuccess('Proyecto actualizado correctamente');
      } else {
        await createPlanificacion(payload);
        setSuccess('Proyecto creado correctamente');
      }
      limpiar();
      await cargar();
      await refreshData();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (proyecto) => {
    if (!window.confirm('¿Está seguro de eliminar este proyecto?')) return;
    setError('');
    setSuccess('');
    try {
      await deletePlanificacion(proyecto.id_planificacion);
      setSuccess('Proyecto eliminado correctamente');
      await cargar();
      await refreshData();
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  const docenteDisplay = miDocente ? `${miDocente.apellido}, ${miDocente.nombre}` : '';

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Proyectos — {materiaNombre} ({cursoNombre})</h3>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="flex-row--end mb-16">
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          <i className={`fas fa-${showNewForm ? 'minus' : 'plus'}`} aria-hidden="true" />{' '}
          {showNewForm ? 'Cerrar' : 'Crear proyecto'}
        </button>
      </div>

      {showNewForm && (
        <FormProyecto
          formData={formData}
          setFormData={setFormData}
          editing={null}
          guardando={guardando}
          onSubmit={(e) => handleSubmit(e, false)}
          onCancel={limpiar}
        />
      )}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Archivo PDF</th>
              <th>Fecha de carga</th>
              <th>Docente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state-message">No hay proyectos registrados.</td>
              </tr>
            ) : (
              proyectos.map((p) => (
                <Fragment key={p.id_planificacion}>
                  <tr>
                    <td>
                      {p.ruta_archivo ? (
                        <a
                          href={`${API_BASE}${p.ruta_archivo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success table-download-btn"
                        >
                          <i className="fas fa-file-pdf" aria-hidden="true" /> Ver PDF
                        </a>
                      ) : '—'}
                    </td>
                    <td>{p.fecha_subida ? new Date(p.fecha_subida).toLocaleDateString() : '—'}</td>
                    <td>{p.docente_nombre || docenteDisplay || '—'}</td>
                    <td className="acciones-cell flex-row--center">
                      {p.ruta_archivo && (
                        <a
                          href={`${API_BASE}${p.ruta_archivo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-success"
                          title="Descargar"
                          aria-label="Descargar"
                        >
                          <i className="fas fa-download" aria-hidden="true" />
                        </a>
                      )}
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => abrirEditar(p)} title="Editar" aria-label="Editar">
                        <i className="fas fa-edit" aria-hidden="true" />
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(p)} title="Eliminar" aria-label="Eliminar">
                        <i className="fas fa-trash-alt" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <FormProyecto
          editing={editing}
          formData={formData}
          setFormData={setFormData}
          guardando={guardando}
          onSubmit={(e) => handleSubmit(e, true)}
          onCancel={limpiar}
        />
      )}
    </div>
  );
}

export default PanelPlanif;