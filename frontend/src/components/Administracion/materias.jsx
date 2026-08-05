import { Fragment, useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { createMateria, updateMateria } from '../../services/api';
import AsignacionMaterias from './asignacionMaterias';
import FormModal from '../../components/Shared/FormModal';
import confirmarEliminacion from '../../utils/confirmarEliminacion';

const formVacio = { nombre_materia: '' };

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.values(data).flat().join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function FormMateria({ formData, setFormData, editing, guardando, onSubmit, onCancel }) {
  return (
    <FormModal title={editing ? 'Editar materia' : 'Nueva materia'} onClose={onCancel}>
      <form onSubmit={onSubmit}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="form-group-filter">
            <label htmlFor="mat-nombre">Nombre de la materia</label>
            <input id="mat-nombre" type="text" value={formData.nombre_materia} onChange={(e) => setFormData((p) => ({ ...p, nombre_materia: e.target.value }))} required />
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

function GestionMaterias() {
  const { adminMaterias, refreshAdminMaterias } = useData();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    refreshAdminMaterias(mostrarInactivos);
  }, [mostrarInactivos, refreshAdminMaterias]);

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

  const abrirEditar = (materia) => {
    limpiar();
    setEditing(materia);
    setFormData({ nombre_materia: materia.nombre_materia || '' });
  };

  const handleSubmit = async (e, esEdicion) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGuardando(true);
    try {
      const payload = { nombre_materia: formData.nombre_materia };
      if (esEdicion) {
        await updateMateria(editing.id_materia, payload);
        setSuccess('Materia actualizada correctamente');
      } else {
        await createMateria(payload);
        setSuccess('Materia creada correctamente');
      }
      limpiar();
      await refreshAdminMaterias(mostrarInactivos);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = async (materia) => {
    if (!confirmarEliminacion(
      'Esta materia dejará de estar disponible para nuevas operaciones.\n\n' +
      'No se eliminará ningún dato histórico.\n\n' +
      'Se conservarán:\n' +
      '• horarios\n• actividades\n• asistencias\n' +
      '• calificaciones\n• planificaciones\n\n' +
      '¿Desea continuar?'
    )) return;
    setError('');
    setSuccess('');
    try {
      await updateMateria(materia.id_materia, { activo: false });
      setSuccess('Materia desactivada correctamente');
      await refreshAdminMaterias(mostrarInactivos);
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="flex-row--between mb-16">
        <label style={{ cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} style={{ marginRight: '8px' }} />
          Mostrar registros inactivos
        </label>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          <i className="fas fa-plus" aria-hidden="true" /> Nueva Materia
        </button>
      </div>

      {showNewForm && (
        <FormMateria
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
              <th>Materia</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {adminMaterias.length === 0 ? (
              <tr><td colSpan={3} className="empty-state-message">No hay materias registradas.</td></tr>
            ) : (
              adminMaterias.map((m) => (
                <Fragment key={m.id_materia}>
                  <tr>
                    <td>{m.nombre_materia}</td>
                    <td>
                      <span className={`badge ${m.activo ? 'badge-success' : 'badge-danger'}`}>{m.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="acciones-cell flex-row--center">
                      {m.activo && (
                        <div>
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => abrirEditar(m)} aria-label="Editar materia" title="Editar"><i className="fas fa-edit" aria-hidden="true" /></button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDesactivar(m)} aria-label="Desactivar materia" title="Desactivar"><i className="fas fa-ban" aria-hidden="true" /></button>
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
        <FormMateria
          formData={formData}
          setFormData={setFormData}
          editing={editing}
          guardando={guardando}
          onSubmit={(e) => handleSubmit(e, true)}
          onCancel={limpiar}
        />
      )}
    </div>
  );
}

function Materias() {
  const [tab, setTab] = useState('gestion');

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h2 className="m-0">Materias</h2>
          <div className="tabs-container m-0">
            <button
              type="button"
              className={`tab-btn${tab === 'gestion' ? ' active' : ''}`}
              onClick={() => setTab('gestion')}
              style={{ padding: '8px 16px', cursor: 'pointer', background: tab === 'gestion' ? 'var(--primary-color)' : 'transparent', color: tab === 'gestion' ? '#fff' : 'inherit', border: '1px solid var(--border-color)', borderRadius: '4px 4px 0 0' }}
            >
              Gestión de Materias
            </button>
            <button
              type="button"
              className={`tab-btn${tab === 'asignacion' ? ' active' : ''}`}
              onClick={() => setTab('asignacion')}
              style={{ padding: '8px 16px', cursor: 'pointer', background: tab === 'asignacion' ? 'var(--primary-color)' : 'transparent', color: tab === 'asignacion' ? '#fff' : 'inherit', border: '1px solid var(--border-color)', borderRadius: '4px 4px 0 0' }}
            >
              Asignación de Materias
            </button>
          </div>
        </div>
      </div>
      <div className="card-body">
        {tab === 'gestion' && <GestionMaterias />}
        {tab === 'asignacion' && <AsignacionMaterias />}
      </div>
    </div>
  );
}

export default Materias;
