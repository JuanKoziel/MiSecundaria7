import { useData } from '../../context/DataContext';
import { useMemo } from 'react';
import SidebarToggle from '../Shared/SidebarToggle';

function TopHeader({ user, nombreCompleto, onLogout }) {
  const { 
    docentes,
    cursoMateria,
    cursosObj,
    suplencias,
    mapSuplencias,
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
      const s = mapSuplencias?.[cm.id];
      const esTitular = cm.id_docente === miDocente.id;
      const esSuplente = Boolean(s && s.id_docente_suplente === miDocente.id);
      if (!esTitular && !esSuplente) return;
      if (!map.has(cm.id_curso)) {
        const cObj = cursosObj.find((c) => c.id_curso === cm.id_curso);
        map.set(cm.id_curso, {
          id_curso: cm.id_curso,
          nombre: cm.curso_nombre || '',
          anio: cObj?.ciclo_anio || '',
        });
      }
    });
    return [...map.values()];
  }, [cursoMateria, cursosObj, miDocente, mapSuplencias]);

  const inicial = user?.username ? user.username.charAt(0) : 'U';
  const iniciales = useMemo(() => {
    const n = (miDocente?.nombre || '').trim().charAt(0) || '';
    const a = (miDocente?.apellido || '').trim().charAt(0) || '';
    return (n + a).toUpperCase() || inicial;
  }, [miDocente]);
  const rol = user?.role ? user.role.toUpperCase() : 'DOCENTE';
  const nombre = nombreCompleto || user?.username || 'Usuario';

  // Materias disponibles para el curso seleccionado (incluye suplencias)
  const materiasDelCurso = useMemo(() => {
    if (!selectedCursoId || !miDocente) return [];
    return cursoMateria
      .filter((cm) => {
        const s = mapSuplencias?.[cm.id];
        const esTitular = String(cm.id_curso) === String(selectedCursoId) && cm.id_docente === miDocente.id;
        const esSuplente = String(cm.id_curso) === String(selectedCursoId) && Boolean(s && s.id_docente_suplente === miDocente.id);
        return esTitular || esSuplente;
      })
      .map((cm) => ({
        id: cm.id,
        nombre: cm.materia_nombre,
        esSuplente: Boolean(mapSuplencias?.[cm.id]?.id_docente_suplente === miDocente.id),
      }));
  }, [cursoMateria, selectedCursoId, miDocente, mapSuplencias]);

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
    <header className="main-header main-header--dark">
      <div className="main-header-left">
        <SidebarToggle />

        <div className="main-header-greeting">
          <h2>
            <span className="greeting-saludo">Bienvenido:</span>{' '}
            <span className="greeting-nombre">{nombre}</span>
          </h2>
        </div>

        <div className="main-header-selectors">
          <div className="selector-group">
            <label htmlFor="global-curso-select" className="selector-label">
              <i className="fas fa-school" aria-hidden="true" /> Curso
            </label>
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
              <label htmlFor="global-materia-select" className="selector-label">
                <i className="fas fa-book-open" aria-hidden="true" /> Materia
              </label>
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
                    {m.nombre}{m.esSuplente ? ' (Suplencia)' : ''}
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

      <div className="user-profile-info user-profile-card">
        <div className="user-avatar-wrap">
          <div className="user-avatar">{iniciales}</div>
        </div>
        <span className="badge role-badge-display">
          <span className="role-dot" aria-hidden="true" />
          {rol}
        </span>
      </div>
    </header>
  );
}

export default TopHeader;