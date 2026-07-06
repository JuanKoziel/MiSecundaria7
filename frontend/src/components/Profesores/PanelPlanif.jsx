import { Fragment, useState, useEffect, useCallback } from 'react';
import { getPlanificaciones, createPlanificacion, updatePlanificacion, deletePlanificacion } from '../../services/api';
import { useData } from '../../context/DataContext';

const API_BASE = 'http://localhost:8000';

const formVacio = { contenido: '', objetivos: '', salidas: '', fundamentacion: '' };

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.values(data).flat().join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function FormProyecto({ formData, setFormData, editing, saving, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} style={{ padding: '16px', background: 'var(--sidebar-hover)', borderRadius: 'var(--radius)', margin: '8px 0' }}>
      <div className="form-group-filter">
        <label htmlFor="proy-contenido">Contenido</label>
        <textarea
          id="proy-contenido"
          rows={5}
          value={formData.contenido}
          onChange={(e) => setFormData((p) => ({ ...p, contenido: e.target.value }))}
          required
          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
      <div className="form-group-filter" style={{ marginTop: '12px' }}>
        <label htmlFor="proy-objetivos">Objetivos</label>
        <textarea
          id="proy-objetivos"
          rows={5}
          value={formData.objetivos}
          onChange={(e) => setFormData((p) => ({ ...p, objetivos: e.target.value }))}
          required
          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
      <div className="form-group-filter" style={{ marginTop: '12px' }}>
        <label htmlFor="proy-salidas">Salidas</label>
        <textarea
          id="proy-salidas"
          rows={5}
          value={formData.salidas}
          onChange={(e) => setFormData((p) => ({ ...p, salidas: e.target.value }))}
          required
          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
      <div className="form-group-filter" style={{ marginTop: '12px' }}>
        <label htmlFor="proy-fundamentacion">Fundamentación</label>
        <textarea
          id="proy-fundamentacion"
          rows={5}
          value={formData.fundamentacion}
          onChange={(e) => setFormData((p) => ({ ...p, fundamentacion: e.target.value }))}
          required
          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
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
  const [saving, setSaving] = useState(false);

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
    limpiar();
    setShowNewForm((prev) => !prev);
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
    setSaving(true);
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
      setSaving(false);
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
          saving={saving}
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
                    <td className="acciones-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                  {editing && editing.id_planificacion === p.id_planificacion && (
                    <tr key={`${p.id_planificacion}-edit`}>
                      <td colSpan={4} style={{ padding: 0 }}>
                        <FormProyecto
                          formData={formData}
                          setFormData={setFormData}
                          editing={editing}
                          saving={saving}
                          onSubmit={(e) => handleSubmit(e, true)}
                          onCancel={limpiar}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelPlanif;