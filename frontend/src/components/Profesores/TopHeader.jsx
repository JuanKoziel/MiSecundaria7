import { useData } from '../../context/DataContext';
import { useMemo, useCallback, useEffect, useRef } from 'react';
import SidebarToggle from '../Shared/SidebarToggle';
import Logo from '../Shared/Logo';

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
    () => docentes.find((d) => d.id_usuario != null && userId != null && String(d.id_usuario) === String(userId)) || null,
    [docentes, userId],
  );
  const miDocenteId = miDocente?.id ?? null;

  // Las comparaciones de ids se hacen por string: la API y el login no siempre
  // devuelven el mismo tipo, y con `===` el selector quedaba vacío.
  const esTitular = useCallback(
    (cm) => miDocenteId != null && cm?.id_docente != null && String(cm.id_docente) === String(miDocenteId),
    [miDocenteId],
  );
  const esSuplente = useCallback(
    (cm) => {
      const s = mapSuplencias?.[cm?.id];
      return Boolean(s && miDocenteId != null && s.id_docente_suplente != null && String(s.id_docente_suplente) === String(miDocenteId));
    },
    [mapSuplencias, miDocenteId],
  );

  const misCursos = useMemo(() => {
    if (miDocenteId == null) return [];
    const map = new Map();
    cursoMateria.forEach((cm) => {
      if (!esTitular(cm) && !esSuplente(cm)) return;
      if (!map.has(cm.id_curso)) {
        const cObj = cursosObj.find((c) => String(c.id_curso) === String(cm.id_curso));
        map.set(cm.id_curso, {
          id_curso: cm.id_curso,
          nombre: cm.curso_nombre || '',
          anio: cObj?.ciclo_anio || '',
        });
      }
    });
    return [...map.values()].sort(
      (a, b) => (Number(a.anio) || 0) - (Number(b.anio) || 0) || String(a.nombre).localeCompare(String(b.nombre)),
    );
  }, [cursoMateria, cursosObj, miDocenteId, esTitular, esSuplente]);

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
    if (!selectedCursoId || miDocenteId == null) return [];
    return cursoMateria
      .filter((cm) => String(cm.id_curso) === String(selectedCursoId) && (esTitular(cm) || esSuplente(cm)))
      .map((cm) => ({
        id: cm.id,
        nombre: cm.materia_nombre,
        esSuplente: esSuplente(cm),
      }));
  }, [cursoMateria, selectedCursoId, miDocenteId, esTitular, esSuplente]);

  // Al cargar, si todavía no hay curso elegido se toma el primero del docente para
  // que el panel no quede en blanco. Solo una vez: el botón "limpiar" debe
  // seguir vaciando la selección.
  const cursoAutoSeleccionadoRef = useRef(false);
  useEffect(() => {
    if (cursoAutoSeleccionadoRef.current) return;
    if (selectedCursoId || misCursos.length === 0) return;
    cursoAutoSeleccionadoRef.current = true;
    setSeleccionCursoMateria(String(misCursos[0].id_curso), '', '');
  }, [selectedCursoId, misCursos, setSeleccionCursoMateria]);

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
          <Logo className="header-logo" />
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