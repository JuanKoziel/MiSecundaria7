import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { createDiagnosticoGrupal, deleteDiagnosticoGrupal } from '../../services/api';
import FormModal from './FormModal';

function DiagnosticosView({ userRole, selectedChild, cursoSeleccionado }) {
  const {
    diagnosticos,
    alumnos,
    cursosObj,
    cursoMateria,
    docentes,
    padresTutores,
    refreshData,
  } = useData();
  const { user } = useAuth();
  
  const miDocente = useMemo(() => docentes.find((d) => d.id_usuario === (user?.id || user?.id_usuario)), [docentes, user]);

  const [selectedDiagnostico, setSelectedDiagnostico] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDiagnostico, setNewDiagnostico] = useState({ id_curso: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);
  const [saveError, setSaveError] = useState('');

  const diagnosticosFiltrados = useMemo(() => {
    if (!user || !diagnosticos) return [];

    const userId = user.id || user.id_usuario;

    switch (userRole) {
      case 'alumno': {
        const miAlumno = alumnos.find((a) => a.id_usuario === userId);
        if (!miAlumno) return [];
        const miCursoId = miAlumno.id_curso;

        const filtered = diagnosticos.filter((d) => d.id_curso === miCursoId);
        return filtered;
      }

      case 'familia': {
        // Si un hijo específico está seleccionado, filtrar solo para ese hijo
        if (selectedChild && selectedChild.alumnoId) {
          const alumno = alumnos.find((a) => a.id === selectedChild.alumnoId);
          if (alumno) {
            const cursoId = alumno.id_curso;
            const filtered = diagnosticos.filter((d) => d.id_curso === cursoId);
            return filtered;
          }
          return [];
        }

        // Fallback: mostrar todos los diagnósticos de los hijos
        const miTutor = padresTutores.find((pt) => pt.id_usuario === userId);
        if (!miTutor) return [];
        const misHijos = alumnos.filter((a) => a.id_tutor === miTutor.id_tutor);
        const cursosHijos = new Set(misHijos.map((h) => h.id_curso).filter(Boolean));

        const filtered = diagnosticos.filter((d) => cursosHijos.has(d.id_curso));
        return filtered;
      }

      case 'docente': {
        const miDocente = docentes.find((d) => d.id_usuario === userId);
        if (!miDocente) return [];
        const misAsignaciones = cursoMateria.filter((cm) => cm.id_docente === miDocente.id);
        const misCursos = new Set(misAsignaciones.map((cm) => cm.id_curso));

        // Filtrar por permiso: mostrar diagnósticos de cursos donde el docente tiene asignaciones
        const filteredByPermission = diagnosticos.filter((d) => misCursos.has(d.id_curso));

        // Aplicar filtro de curso si está seleccionado
        if (cursoSeleccionado) {
          return filteredByPermission.filter((d) => d.id_curso === Number(cursoSeleccionado));
        }

        return filteredByPermission;
      }

      case 'admin':
      case 'director':
        return diagnosticos;

      default:
        return [];
    }
  }, [diagnosticos, user, userRole, alumnos, cursoMateria, docentes, padresTutores, selectedChild, cursoSeleccionado]);

  const diagnosticosOrdenados = useMemo(() => {
    return [...diagnosticosFiltrados].sort((a, b) => {
      const fechaA = new Date(b.fecha || 0);
      const fechaB = new Date(a.fecha || 0);
      return fechaA - fechaB;
    });
  }, [diagnosticosFiltrados]);

  const getNombreCurso = (cursoId) => {
    const curso = cursosObj.find((c) => c.id_curso === cursoId);
    return curso ? curso.nombre_curso : '—';
  };

  const misCursos = useMemo(() => {
    if (userRole !== 'docente' || !user) return [];
    const miDocente = docentes.find((d) => d.id_usuario === (user.id || user.id_usuario));
    if (!miDocente) return [];
    const misAsignaciones = cursoMateria.filter((cm) => cm.id_docente === miDocente.id);
    const cursosSet = new Set(misAsignaciones.map((cm) => cm.id_curso));
    return cursosObj.filter((c) => cursosSet.has(c.id_curso));
  }, [userRole, user, docentes, cursoMateria, cursosObj]);

  const handleDelete = async (d) => {
    if (window.confirm('¿Está seguro de que desea eliminar este diagnóstico grupal?')) {
      try {
        await deleteDiagnosticoGrupal(d.id);
        await refreshData();
        alert('Diagnóstico eliminado correctamente.');
      } catch (err) {
        console.error('Error deleting diagnostico:', err);
        alert('Error al eliminar el diagnóstico.');
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setSaveError('');

    try {
      if (!miDocente) {
        setSaveError('No se encontró el perfil de docente');
        setGuardando(false);
        return;
      }

      const payload = {
        id_curso: Number(newDiagnostico.id_curso),
        id_docente: miDocente.id,
        fecha: new Date().toISOString().split('T')[0],
        descripcion: newDiagnostico.descripcion,
      };

      await createDiagnosticoGrupal(payload);
      setNewDiagnostico({ id_curso: '', descripcion: '' });
      setShowCreateForm(false);
      await refreshData();
      alert('Diagnóstico creado correctamente.');
    } catch (err) {
      console.error('Error creating diagnostico:', err);
      setSaveError('Error al crear el diagnóstico. Verificá que tengas permisos para este curso.');
    } finally {
      setGuardando(false);
    }
  };

  if (selectedDiagnostico) {
    return (
      <div className="card">
        <div className="card-header-flex">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedDiagnostico(null)}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
          </button>
          <h3>Detalle del Diagnóstico</h3>
        </div>

        <div className="mt-16">
          <h2>Diagnóstico Grupal</h2>
          <div className="mt-12 text-muted" style={{ fontSize: '14px' }}>
            <p><strong>Docente:</strong> {selectedDiagnostico.docente}</p>
            <p><strong>Fecha:</strong> {selectedDiagnostico.fecha}</p>
            <p><strong>Curso:</strong> {getNombreCurso(selectedDiagnostico.id_curso)}</p>
          </div>

          <div className="mt-20" style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedDiagnostico.descripcion}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {userRole === 'docente' && (
        <div className="card mb-16">
          <div className="card-header-flex">
            <h3>Nuevo Diagnóstico Grupal</h3>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <i className="fas fa-plus" aria-hidden="true" /> Crear
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <FormModal title="Nuevo Diagnóstico Grupal" onClose={() => {
          setShowCreateForm(false);
          setNewDiagnostico({ id_curso: '', descripcion: '' });
          setSaveError('');
        }}>
          <form onSubmit={handleCreate} className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="nuevo-curso">Curso</label>
              <select
                id="nuevo-curso"
                value={newDiagnostico.id_curso}
                onChange={(e) => setNewDiagnostico({ ...newDiagnostico, id_curso: e.target.value })}
                required
              >
                <option value="">Seleccione un curso...</option>
                {misCursos.map((c) => (
                  <option key={c.id_curso} value={String(c.id_curso)}>
                    {c.nombre_curso}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nuevo-descripcion">Descripción</label>
              <textarea
                id="nuevo-descripcion"
                value={newDiagnostico.descripcion}
                onChange={(e) => setNewDiagnostico({ ...newDiagnostico, descripcion: e.target.value })}
                required
                rows={6}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {saveError && (
              <div className="mb-12" style={{ color: '#dc3545', fontSize: '14px' }}>
                {saveError}
              </div>
            )}

            <div className="flex-row">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDiagnostico({ id_curso: '', descripcion: '' });
                  setSaveError('');
                }}
                disabled={guardando}
              >
                Cancelar
              </button>
            </div>
          </form>
        </FormModal>
      )}

      <div className="card">
        <div className="card-header-flex">
          <h3>Información General (Diagnósticos)</h3>
          <span className="badge role-badge-display">
            {userRole === 'docente' ? 'Crear y visualizar' : 'Solo lectura'}
          </span>
        </div>

        {diagnosticosOrdenados.length === 0 ? (
          <p className="empty-state-message empty-state-centered">
            No hay diagnósticos disponibles para visualizar.
          </p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Docente</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
              {diagnosticosOrdenados.map((d) => (
                <tr key={d.id}>
                  <td className="table-cell-strong">{getNombreCurso(d.id_curso)}</td>
                  <td>{d.docente}</td>
                  <td>{d.fecha || '—'}</td>
                  <td className="flex-row">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedDiagnostico(d)}
                    >
                      <i className="fas fa-eye" aria-hidden="true" /> Ver
                    </button>
                    {userRole === 'docente' && miDocente && miDocente.id === d.id_docente && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(d)}
                      >
                        <i className="fas fa-trash" aria-hidden="true" /> Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  );
}

export default DiagnosticosView;
