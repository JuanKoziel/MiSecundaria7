import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createDiagnosticoGrupal, deleteDiagnosticoGrupal } from '../../services/api';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import FormModal from './FormModal';

function DiagnosticosView({ userRole, selectedChild, cursoSeleccionado, cursosEditables }) {
  const {
    diagnosticos,
    estudiantes,
    cursosObj,
    cursoMateria,
    docentes,
    padresTutores,
    refreshData,
  } = useData();
  const { user } = useAuth();
  const toast = useToast();

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
        const miEstudiante = estudiantes.find((a) => a.id_usuario === userId);
        if (!miEstudiante) return [];
        const miCursoId = miEstudiante.id_curso;

        const filtered = diagnosticos.filter((d) => d.id_curso === miCursoId);
        return filtered;
      }

      case 'familia': {
        // Si un hijo específico está seleccionado, filtrar solo para ese hijo
        if (selectedChild && selectedChild.alumnoId) {
          const estudiante = estudiantes.find((a) => a.id === selectedChild.alumnoId);
          if (estudiante) {
            const cursoId = estudiante.id_curso;
            const filtered = diagnosticos.filter((d) => d.id_curso === cursoId);
            return filtered;
          }
          return [];
        }

        // Fallback: mostrar todos los diagnósticos de los hijos
        const miTutor = padresTutores.find((pt) => pt.id_usuario === userId);
        if (!miTutor) return [];
        const misHijos = estudiantes;
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
  }, [diagnosticos, user, userRole, estudiantes, cursoMateria, docentes, padresTutores, selectedChild, cursoSeleccionado]);

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

  const puedeCrear = useMemo(() => {
    if (userRole !== 'docente') return false;
    if (!cursosEditables || cursosEditables.size === 0) return true;
    return misCursos.some((c) => cursosEditables.has(c.id_curso));
  }, [userRole, cursosEditables, misCursos]);

  const cursoEsEditable = (cursoId) => {
    if (!cursosEditables || cursosEditables.size === 0) return true;
    return cursosEditables.has(cursoId);
  };

  const handleDelete = async (d) => {
    await confirmarEliminacion(undefined, {
      onConfirm: async () => {
        try {
          await deleteDiagnosticoGrupal(d.id);
          await refreshData();
          toast.success('Diagnóstico eliminado correctamente.');
        } catch (err) {
          console.error('Error deleting diagnostico:', err);
          toast.error('Error al eliminar el diagnóstico.');
        }
      },
    });
  };

  const abrirCrear = () => {
    const cursoInicial =
      String(cursoSeleccionado || '') ||
      String(misCursos.find((c) => cursoEsEditable(c.id_curso))?.id_curso || '');
    setNewDiagnostico({ id_curso: cursoInicial, descripcion: '' });
    setSaveError('');
    setShowCreateForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setSaveError('');

    try {
      if (!miDocente) {
        toast.warning('No se encontró el perfil de docente.');
        setGuardando(false);
        return;
      }
      if (!newDiagnostico.id_curso) {
        toast.warning('No se pudo identificar el curso para el diagnóstico.');
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
      toast.success('Diagnóstico creado correctamente.');
    } catch (err) {
      console.error('Error creating diagnostico:', err);
      toast.error('Error al crear el diagnóstico. Verificá que tengas permisos para este curso.');
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
      {showCreateForm && (
        <FormModal title="Nuevo Diagnóstico Grupal" onClose={() => {
          setShowCreateForm(false);
          setNewDiagnostico({ id_curso: '', descripcion: '' });
          setSaveError('');
        }}>
          <form onSubmit={handleCreate} className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
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
          <h3><i className="fas fa-clipboard-check" aria-hidden="true" /> Diagnósticos</h3>
          {userRole === 'docente' && puedeCrear && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={abrirCrear}
            >
              <i className="fas fa-plus" aria-hidden="true" /> Crear
            </button>
          )}
        </div>

        {userRole === 'docente' && !puedeCrear && (
          <p
            style={{
              background: '#fff4cf',
              borderLeft: '4px solid #d97706',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.9rem',
              color: '#854d0e',
              lineHeight: '1.6',
              margin: '0 0 16px',
            }}
          >
            <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
            No podés crear diagnósticos para estos cursos mientras existan suplencias activas.
          </p>
        )}

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
                    {userRole === 'docente' && miDocente && miDocente.id === d.id_docente && cursoEsEditable(d.id_curso) && (
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
