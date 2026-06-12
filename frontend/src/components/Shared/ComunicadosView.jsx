import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:8000';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  return 'badge-tarde';
}

function ComunicadosView({ userRole, selectedChild, cursoSeleccionado }) {
  const {
    comunicados,
    alumnos,
    cursosObj,
    cursoMateria,
    docentes,
    padresTutores,
    preceptores,
  } = useData();
  const { user } = useAuth();

  const [selectedComunicado, setSelectedComunicado] = useState(null);

  const comunicadosFiltrados = useMemo(() => {
    if (!user || !comunicados) return [];

    const userId = user.id || user.id_usuario;

    switch (userRole) {
      case 'alumno': {
        const miAlumno = alumnos.find((a) => a.id_usuario === userId);
        if (!miAlumno) return [];
        const miCursoId = miAlumno.id_curso;
        const misMaterias = cursoMateria
          .filter((cm) => cm.id_curso === miCursoId)
          .map((cm) => cm.id_materia);

        const filtered = comunicados.filter((c) => {
          if (c.id_curso === miCursoId) return true;
          if (c.id_materia && misMaterias.includes(c.id_materia)) return true;
          return false;
        });
        return filtered;
      }

      case 'familia': {
        // If a specific child is selected, filter only for that child
        if (selectedChild && selectedChild.alumnoId) {
          const alumno = alumnos.find((a) => a.id === selectedChild.alumnoId);
          if (alumno) {
            const cursoId = alumno.id_curso;
            const filtered = comunicados.filter((c) => c.id_curso === cursoId);
            return filtered;
          }
          return [];
        }

        // Fallback: show all children's communications (original behavior)
        const miTutor = padresTutores.find((pt) => pt.id_usuario === userId);
        if (!miTutor) return [];
        const misHijos = alumnos.filter((a) => a.id_tutor === miTutor.id_tutor);
        const cursosHijos = new Set(misHijos.map((h) => h.id_curso).filter(Boolean));
        const materiasHijos = new Set(
          misHijos
            .flatMap((h) => cursoMateria.filter((cm) => cm.id_curso === h.id_curso))
            .map((cm) => cm.id_materia)
        );

        const filtered = comunicados.filter((c) => {
          if (c.id_curso && cursosHijos.has(c.id_curso)) return true;
          if (c.id_materia && materiasHijos.has(c.id_materia)) return true;
          return false;
        });
        return filtered;
      }

      case 'docente': {
        const miDocente = docentes.find((d) => d.id_usuario === userId);
        if (!miDocente) return [];
        const misAsignaciones = cursoMateria.filter((cm) => cm.id_docente === miDocente.id);

        // Filter by permission rules
        const filteredByPermission = comunicados.filter((c) => {
          // Comunicado general (sin materia): ver si tiene asignación en ese curso
          if (!c.id_materia) {
            return misAsignaciones.some((cm) => cm.id_curso === c.id_curso);
          }

          // Comunicado específico de materia: ver si tiene asignación exacta
          return misAsignaciones.some(
            (cm) =>
              cm.id_curso === c.id_curso &&
              cm.id_materia === c.id_materia &&
              cm.id_docente === miDocente.id
          );
        });

        // Apply course filter if selected
        if (cursoSeleccionado) {
          return filteredByPermission.filter((c) => c.id_curso === Number(cursoSeleccionado));
        }

        return filteredByPermission;
      }

      case 'preceptor': {
        const miPreceptor = preceptores.find((p) => p.id_usuario === userId);
        if (!miPreceptor) return [];
        const misCursos = cursosObj.filter((c) => c.id_preceptor === miPreceptor.id_preceptor);
        const misCursosIds = new Set(misCursos.map((c) => c.id_curso));

        const filtered = comunicados.filter((c) => {
          if (c.id_curso && misCursosIds.has(c.id_curso)) return true;
          if (!c.id_curso && !c.id_materia) return true;
          return false;
        });
        return filtered;
      }

      case 'admin':
        return comunicados;

      default:
        return [];
    }
  }, [comunicados, user, userRole, alumnos, cursoMateria, cursosObj, docentes, padresTutores, preceptores, selectedChild, cursoSeleccionado]);

  const comunicadosOrdenados = useMemo(() => {
    return [...comunicadosFiltrados].sort((a, b) => {
      const fechaA = new Date(b.fecha || 0);
      const fechaB = new Date(a.fecha || 0);
      return fechaA - fechaB;
    });
  }, [comunicadosFiltrados]);

  const handleFileDownload = (ruta) => {
    window.open(`${API_BASE}${ruta}`, '_blank');
  };

  const getNombreCurso = (cursoId) => {
    const curso = cursosObj.find((c) => c.id_curso === cursoId);
    return curso ? curso.nombre_curso : '—';
  };

  const getNombreMateria = (materiaId) => {
    const cm = cursoMateria.find((c) => c.id_materia === materiaId);
    return cm ? cm.materia_nombre : '—';
  };

  const getNombreAutor = (usuarioId) => {
    return usuarioId ? `Usuario #${usuarioId}` : '—';
  };

  if (selectedComunicado) {
    return (
      <div className="card">
        <div className="card-header-flex">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedComunicado(null)}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
          </button>
          <h3>Detalle del Comunicado</h3>
        </div>

        <div style={{ marginTop: '16px' }}>
          <h2>{selectedComunicado.titulo}</h2>
          <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
            <p><strong>Autor:</strong> {getNombreAutor(selectedComunicado.id_usuario_creador)}</p>
            <p><strong>Fecha y hora:</strong> {selectedComunicado.fecha}</p>
            <p><strong>Curso destinatario:</strong> {getNombreCurso(selectedComunicado.id_curso)}</p>
            {selectedComunicado.id_materia && (
              <p><strong>Materia destinataria:</strong> {getNombreMateria(selectedComunicado.id_materia)}</p>
            )}
          </div>

          <div style={{ marginTop: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedComunicado.cuerpo}</p>
          </div>

          {selectedComunicado.archivos && selectedComunicado.archivos.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Archivos adjuntos ({selectedComunicado.archivos.length})</h4>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedComunicado.archivos.map((archivo) => (
                  <div
                    key={archivo.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>
                      <i className="fas fa-paperclip" aria-hidden="true" />{' '}
                      {archivo.ruta_archivo.split('/').pop()}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => handleFileDownload(archivo.ruta_archivo)}
                      >
                        <i className="fas fa-eye" aria-hidden="true" /> Ver
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `${API_BASE}${archivo.ruta_archivo}`;
                          link.download = archivo.ruta_archivo.split('/').pop();
                          link.click();
                        }}
                      >
                        <i className="fas fa-download" aria-hidden="true" /> Descargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Comunicados</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      {comunicadosOrdenados.length === 0 ? (
        <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
          No hay comunicados disponibles para visualizar.
        </p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha de publicación</th>
                <th>Autor</th>
                <th>Curso asignado</th>
                <th>Materia asignada</th>
                <th>Archivos adjuntos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comunicadosOrdenados.map((c) => (
                <tr key={c.id_comunicado}>
                  <td className="table-cell-strong">{c.titulo}</td>
                  <td>{c.fecha ? c.fecha.split('T')[0] : '—'}</td>
                  <td>{getNombreAutor(c.id_usuario_creador)}</td>
                  <td>{getNombreCurso(c.id_curso)}</td>
                  <td>{c.id_materia ? getNombreMateria(c.id_materia) : '—'}</td>
                  <td>
                    {c.archivos && c.archivos.length > 0 ? (
                      <span className="badge">{c.archivos.length} archivo(s)</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedComunicado(c)}
                    >
                      <i className="fas fa-eye" aria-hidden="true" /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ComunicadosView;
