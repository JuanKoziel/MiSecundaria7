import { useData } from '../../context/DataContext';
import { parseCurso, orientacionDeCurso } from '../../utils/orientacion';
import SidebarToggle from '../Shared/SidebarToggle';
import Logo from '../Shared/Logo';

function inicialesDesdeNombre(nombreCompleto, user) {
  if (nombreCompleto) {
    const [apellido, nombre] = nombreCompleto.split(',').map((s) => (s || '').trim());
    const ini = `${(nombre || '').charAt(0)}${(apellido || '').charAt(0)}`.toUpperCase();
    if (ini.trim()) return ini;
  }
  return user.username ? user.username.charAt(0).toUpperCase() : 'U';
}

function Header({
  user,
  nombreCompleto,
  anioLectivo,
  curso,
  onAnioChange,
  onCursoChange,
  onCursosChange,
}) {
  const { cursosObj, aniosLectivos } = useData();

  const iniciales = inicialesDesdeNombre(nombreCompleto, user);
  const nombreMostrar = nombreCompleto || user.username || 'Usuario';
  const rol = 'JEFE DE PRECEPTORES';

  const anioLectivoLocal = anioLectivo || '';
  const cursoLocal = curso || '';

  const cursosDelCiclo = (cursosObj || []).filter(
    (c) => String(c.ciclo_anio) === String(anioLectivoLocal),
  );

  const partesPorCurso = cursosDelCiclo.map((c) => parseCurso(c.nombre_curso));

  const aniosDisponibles = [
    ...new Set(partesPorCurso.map((p) => p.anio).filter((a) => a)),
  ].sort((a, b) => a - b);

  // La selección es de un solo curso: el Año y la División salen del curso
  // elegido. Al cambiar el Año lectivo el curso queda deseleccionado.
  const { anio: anioActual, division: divActual } = parseCurso(cursoLocal);

  // El año se compara como texto: desde el `<select>` es string y desde el curso
  // elegido es number. Con `===` entre number y string nunca coincidía y la
  // División quedaba vacía ("Sin divisiones") sin poder marcar.
  const divisionesDisponibles = [
    ...new Set(
      partesPorCurso
        .filter((p) => String(p.anio) === String(anioActual))
        .map((p) => p.division)
        .filter((d) => d),
    ),
  ].sort((a, b) => a - b);

  // Se notifican las dos formas: `curso` para las vistas de un solo curso y
  // `cursos` con ese único elemento para las que leen la lista del contexto.
  const notificarCurso = (nombre) => {
    const elegido = nombre || '';
    onCursoChange?.(elegido);
    onCursosChange?.(elegido ? [elegido] : []);
  };

  const handleAnioAcadChange = (e) => {
    const nuevoAnio = e.target.value;
    notificarCurso(nuevoAnio ? `${nuevoAnio}°` : '');
  };

  const handleDivisionChange = (e) => {
    const nuevaDiv = e.target.value;
    if (!anioActual || !nuevaDiv) {
      notificarCurso(anioActual ? `${anioActual}°` : '');
      return;
    }
    notificarCurso(`${anioActual}°${nuevaDiv}`);
  };

  // Punto 5.2: se muestra la orientación GUARDADA en el curso, nunca inferida por
  // la división. Si el curso no tiene orientación, se muestra "—".
  const cursoObjSeleccionado = (cursosObj || []).find(
    (c) => String(c.nombre_curso || '').trim() === String(cursoLocal || '').trim(),
  );
  const orientacion = orientacionDeCurso(cursoObjSeleccionado);
  const tieneFiltros = !!(anioLectivoLocal || cursoLocal);

  return (
    <header className="main-header main-header--dark">
      <div className="main-header-left">
        <SidebarToggle />
        <div className="main-header-greeting">
          <Logo className="header-logo" />
          <h2>
            <span className="greeting-saludo">Bienvenido:</span>{' '}
            <span className="greeting-nombre">{nombreMostrar}</span>
          </h2>
          <p className="main-header-subtitle">
            <i className="fas fa-school font-accent" aria-hidden="true" />
            Jefatura de Preceptoría
          </p>
        </div>

        <div className="main-header-selectors">
          <div className="selector-group">
            <label htmlFor="global-anio-lectivo" className="selector-label">
              <i className="fas fa-calendar" aria-hidden="true" /> Año lectivo
            </label>
            <select
              id="global-anio-lectivo"
              className="global-select"
              value={anioLectivoLocal}
              onChange={(e) => onAnioChange(e.target.value)}
            >
              <option value="" disabled hidden>
                Seleccioná año
              </option>
              {aniosLectivos.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>

          <div className="selector-group">
            <label htmlFor="global-anio-acad" className="selector-label">
              <i className="fas fa-school" aria-hidden="true" /> Año
            </label>
            <select
              id="global-anio-acad"
              className="global-select"
              value={anioActual || ''}
              onChange={handleAnioAcadChange}
              disabled={!anioLectivoLocal}
            >
              <option value="" disabled hidden>
                Año...
              </option>
              {aniosDisponibles.map((a) => (
                <option key={a} value={a}>
                  {a}°
                </option>
              ))}
            </select>
          </div>

          <div className="selector-group">
            <label htmlFor="global-division" className="selector-label">
              <i className="fas fa-users" aria-hidden="true" /> División
            </label>
            <select
              id="global-division"
              className="global-select"
              value={divActual || ''}
              onChange={handleDivisionChange}
              disabled={!anioActual}
            >
              <option value="" disabled hidden>
                División...
              </option>
              {divisionesDisponibles.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {cursoLocal && (
            <span
              className="badge orientacion-badge"
              title={
                orientacion
                  ? `Orientación del curso: ${orientacion}`
                  : 'Este curso no tiene orientación cargada'
              }
            >
              {orientacion || '—'}
            </span>
          )}

          {tieneFiltros && (
            <button
              type="button"
              className="btn-clear-selection"
              onClick={() => {
                onAnioChange('');
                notificarCurso('');
              }}
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

export default Header;