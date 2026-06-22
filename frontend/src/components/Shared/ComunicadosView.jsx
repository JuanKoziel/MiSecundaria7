import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { parseCurso } from '../../utils/orientacion';

const API_BASE = 'http://localhost:8000';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  return 'badge-tarde';
}

function getAlcance(comunicado) {
  return comunicado?.alcance || comunicado?.alcances?.[0] || null;
}

function comunicadoMatchesCurso(comunicado, cursoObj) {
  if (!comunicado || !cursoObj) return false;
  const alcance = getAlcance(comunicado);
  if (!alcance) return true;

  const hasCiclo = alcance.id_ciclo !== null && alcance.id_ciclo !== undefined;
  const hasCurso = alcance.curso !== null && alcance.curso !== undefined;
  const hasDivision = alcance.division !== null && alcance.division !== undefined;
  const hasMateria = alcance.id_materia !== null && alcance.id_materia !== undefined;

  if (!hasCiclo && !hasCurso && !hasDivision && !hasMateria) return true;

  if (hasCiclo && Number(cursoObj.id_ciclo) !== Number(alcance.id_ciclo)) return false;

  const parts = parseCurso(cursoObj.nombre_curso || '');
  if (hasCurso && parts.anio !== Number(alcance.curso)) return false;
  if (hasDivision && parts.division !== Number(alcance.division)) return false;

  return true;
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
        const miCurso = miAlumno ? cursosObj.find((c) => c.id_curso === miAlumno.id_curso) : null;
        if (!miCurso) return [];
        return comunicados.filter((c) => comunicadoMatchesCurso(c, miCurso));
      }

      case 'familia': {
        if (selectedChild && selectedChild.alumnoId) {
          const alumno = alumnos.find((a) => a.id === selectedChild.alumnoId);
          const cursoObj = alumno ? cursosObj.find((c) => c.id_curso === alumno.id_curso) : null;
          if (!cursoObj) return [];
          return comunicados.filter((c) => comunicadoMatchesCurso(c, cursoObj));
        }

        const miTutor = padresTutores.find((pt) => pt.id_usuario === userId);
        if (!miTutor) return [];
        const misHijos = alumnos.filter((a) => a.id_tutor === miTutor.id_tutor);
        const cursosHijos = misHijos
          .map((h) => cursosObj.find((c) => c.id_curso === h.id_curso))
          .filter(Boolean);
        return comunicados.filter((c) => cursosHijos.some((cursoObj) => comunicadoMatchesCurso(c, cursoObj)));
      }

      case 'docente': {
        const miDocente = docentes.find((d) => d.id_usuario === userId);
        if (!miDocente) return [];
        const misAsignaciones = cursoMateria.filter((cm) => cm.id_docente === miDocente.id);

        const filteredByPermission = comunicados.filter((c) => {
          if (!misAsignaciones.length) return false;
          const alcance = getAlcance(c);
          return misAsignaciones.some((cm) => {
            const cursoObj = cursosObj.find((curso) => curso.id_curso === cm.id_curso);
            if (!comunicadoMatchesCurso(c, cursoObj)) return false;
            if (alcance?.id_materia !== null && alcance?.id_materia !== undefined) {
              return Number(alcance.id_materia) === Number(cm.id_materia);
            }
            return true;
          });
        });

        if (cursoSeleccionado) {
          const cursoSeleccionadoObj = cursosObj.find((c) => c.id_curso === Number(cursoSeleccionado));
          return filteredByPermission.filter((c) => comunicadoMatchesCurso(c, cursoSeleccionadoObj));
        }

        return filteredByPermission;
      }

      case 'preceptor': {
        const miPreceptor = preceptores.find((p) => p.id_usuario === userId);
        if (!miPreceptor) return [];
        const misCursos = cursosObj.filter((c) => c.id_preceptor === miPreceptor.id_preceptor);
        return comunicados.filter((c) => misCursos.some((cursoObj) => comunicadoMatchesCurso(c, cursoObj)));
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
                  <td>{c.alcance_label || getNombreCurso(c.id_curso) || 'General'}</td>
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
