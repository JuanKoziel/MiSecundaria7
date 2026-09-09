import { useData } from '../../context/DataContext';
import { useMemo } from 'react';

function TopHeader({ user, nombreCompleto, onLogout }) {
  const { 
    docentes,
    cursoMateria,
    cursosObj,
    selectedCursoId,
    selectedMateria,
    selectedCursoMateriaId,
    setSeleccionCursoMateria,
    clearSeleccionCursoMateria,
  } = useData();

  const userId = user?.id_usuario ?? user?.id ?? null;
  const miDocente = useMemo(
    () => docentes.find((d) => d.id_usuario === userId) || null,
    [docentes, userId],
  );

  const misCursos = useMemo(() => {
    if (!miDocente) return [];
    const map = new Map();
    cursoMateria.forEach((cm) => {
      if (cm.id_docente === miDocente.id) {
        if (!map.has(cm.id_curso)) {
          const cObj = cursosObj.find((c) => c.id_curso === cm.id_curso);
          map.set(cm.id_curso, {
            id_curso: cm.id_curso,
            nombre: cm.curso_nombre || '',
            anio: cObj?.ciclo_anio || '',
          });
        }
      }
    });
    return [...map.values()];
  }, [cursoMateria, cursosObj, miDocente]);

  const inicial = user?.username ? user.username.charAt(0) : 'U';
  const rol = user?.role ? user.role.toUpperCase() : 'DOCENTE';
  const saludo = nombreCompleto ? `Bienvenido, ${nombreCompleto}` : `Bienvenido, ${user?.username ?? 'Usuario'}`;

  // Materias disponibles para el curso seleccionado
  const materiasDelCurso = useMemo(() => {
    if (!selectedCursoId || !miDocente) return [];
    return cursoMateria
      .filter((cm) => String(cm.id_curso) === String(selectedCursoId) && cm.id_docente === miDocente.id)
      .map((cm) => ({
        id: cm.id,
        nombre: cm.materia_nombre,
      }));
  }, [cursoMateria, selectedCursoId, miDocente]);

  const cursoSeleccionadoObj = useMemo(
    () => misCursos.find((c) => String(c.id_curso) === String(selectedCursoId)),
    [misCursos, selectedCursoId]
  );

  const handleCursoChange = (e) => {
    const nuevoId = e.target.value;
    setSeleccionCursoMateria(nuevoId, '', '');
  };

  const handleMateriaChange = (e) => {
    const materia = e.target.value;
    const cm = cursoMateria.find((c) => c.materia_nombre === materia && String(c.id_curso) === String(selectedCursoId));
    setSeleccionCursoMateria(selectedCursoId, materia, cm?.id || '');
  };

  return (
    <header className="main-header">
      <div className="main-header-left">
        <div className="main-header-greeting">
          <h2>{saludo}</h2>
          <p className="main-header-subtitle">
            {cursoSeleccionadoObj ? (
              <>
                {cursoSeleccionadoObj.nombre}
                {selectedMateria && (
                  <>
                    {' > '}
                    <span className="font-accent">{selectedMateria}</span>
                  </>
                )}
              </>
            ) : (
              'Panel de Gestión Docente — seleccioná curso y materia'
            )}
          </p>
        </div>

        <div className="main-header-selectors">
          <div className="selector-group">
            <label htmlFor="global-curso-select" className="selector-label">Curso</label>
            <select
              id="global-curso-select"
              className="global-select"
              value={selectedCursoId}
              onChange={handleCursoChange}
              disabled={misCursos.length === 0}
            >
              <option value="" disabled hidden>
                Seleccioná un curso
              </option>
              {misCursos.map((c) => (
                <option key={c.id_curso} value={String(c.id_curso)}>
                  {c.nombre} ({c.anio})
                </option>
              ))}
            </select>
          </div>

          {selectedCursoId && (
            <div className="selector-group">
              <label htmlFor="global-materia-select" className="selector-label">Materia</label>
              <select
                id="global-materia-select"
                className="global-select"
                value={selectedMateria}
                onChange={handleMateriaChange}
                disabled={materiasDelCurso.length === 0}
              >
                <option value="" disabled hidden>
                  Seleccioná una materia
                </option>
                {materiasDelCurso.map((m) => (
                  <option key={m.id} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(selectedCursoId || selectedMateria) && (
            <button
              type="button"
              className="btn-clear-selection"
              onClick={clearSeleccionCursoMateria}
              title="Limpiar selección"
            >
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="user-profile-info">
        <span className="badge role-badge-display">{rol}</span>
        <div className="user-avatar">{inicial}</div>
      </div>
    </header>
  );
}

export default TopHeader;