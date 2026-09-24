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

function Header({ user, nombreCompleto, anioLectivo, curso, onAnioChange, onCursoChange }) {
  const { cursosObj, aniosLectivos } = useData();

  const iniciales = inicialesDesdeNombre(nombreCompleto, user);
  const nombreMostrar = nombreCompleto || user.username || 'Usuario';
  const rol = (user.role || 'PRECEPTOR').toUpperCase();

  const cursosDelCiclo = (cursosObj || []).filter(
    (c) => String(c.ciclo_anio) === String(anioLectivo),
  );

  const aniosDisponibles = [
    ...new Set(
      cursosDelCiclo
        .map((c) => parseCurso(c.nombre_curso).anio)
        .filter((a) => a),
    ),
  ].sort((a, b) => a - b);

  const { anio: anioActual, division: divActual } = parseCurso(curso);

  const divisionesDisponibles = [
    ...new Set(
      cursosDelCiclo
        .map((c) => parseCurso(c.nombre_curso))
        .filter((p) => p.anio === anioActual)
        .map((p) => p.division)
        .filter((d) => d),
    ),
  ].sort((a, b) => a - b);

  const handleAnioAcadChange = (e) => {
    const nuevoAnio = e.target.value;
    onCursoChange(nuevoAnio ? `${nuevoAnio}°` : '');
  };

  const handleDivisionChange = (e) => {
    const nuevaDiv = e.target.value;
    if (!anioActual || !nuevaDiv) {
      onCursoChange(anioActual ? `${anioActual}°` : '');
      return;
    }
    onCursoChange(`${anioActual}°${nuevaDiv}`);
  };

  const cursoCompleto = anioActual && divActual ? `${anioActual}°${divActual}` : '';
  const orientacion = cursoCompleto ? orientacionDeCurso(cursoCompleto) : '';
  const tieneFiltros = !!(anioLectivo || curso);

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
            Panel de Gestión Escolar
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
              value={anioLectivo}
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
              disabled={!anioLectivo}
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

          {orientacion && (
            <span className="badge orientacion-badge" title="Orientación del curso">
              {orientacion}
            </span>
          )}

          {tieneFiltros && (
            <button
              type="button"
              className="btn-clear-selection"
              onClick={() => {
                onAnioChange('');
                onCursoChange('');
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