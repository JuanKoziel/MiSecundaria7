import { useEffect, useState } from 'react';
import { useData } from '../../../context/DataContext';
import { parseCurso } from '../../../utils/orientacion';
import SidebarToggle from '../../Shared/SidebarToggle';
import Logo from '../../Shared/Logo';

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
  cursos,
  onAnioChange,
  onCursoChange,
  onCursosChange,
}) {
  const { cursosObj, aniosLectivos } = useData();

  const iniciales = inicialesDesdeNombre(nombreCompleto, user);
  const nombreMostrar = nombreCompleto || user.username || 'Usuario';
  const rol = (user.role || 'ADMIN').toUpperCase();

  const anioLectivoLocal = anioLectivo || '';
  const cursoLocal = curso || '';
  // 5.6 — lista de cursos marcados. Se cae a `[]` mientras la vista destino
  // todavía no pase `cursos`, así el header no rompe si se usa suelto.
  const cursosSeleccionados = Array.isArray(cursos) ? cursos : [];

  const cursosDelCiclo = (cursosObj || []).filter(
    (c) => String(c.ciclo_anio) === String(anioLectivoLocal),
  );

  const partesPorCurso = cursosDelCiclo.map((c) => parseCurso(c.nombre_curso));

  const aniosDisponibles = [
    ...new Set(partesPorCurso.map((p) => p.anio).filter((a) => a)),
  ].sort((a, b) => a - b);

  // 5.6 — El año académico vive en estado local para que se pueda quedar
  // seleccionado aunque no haya ninguna división marcada (si no, al desmarcar
  // todas el `<select>` de Año se borraba y no había forma de volver atrás sin
  // tocar Año lectivo otra vez). Antes venía implícito en el único curso elegido.
  const anioDesdeCurso = cursosSeleccionados.length > 0
    ? (parseCurso(cursosSeleccionados[0]).anio || '')
    : '';
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioDesdeCurso);
  const anioActual = anioDesdeCurso || anioSeleccionado || parseCurso(cursoLocal).anio || '';

  // Al cambiar de Año lectivo se reinicia el Año académico: sus divisiones son
  // otras y las marcas anteriores ya no corresponden a cursos existentes.
  useEffect(() => {
    setAnioSeleccionado('');
  }, [anioLectivoLocal]);

  const divisionesDisponibles = [
    ...new Set(
      partesPorCurso
        .filter((p) => p.anio === anioActual)
        .map((p) => p.division)
        .filter((d) => d),
    ),
  ].sort((a, b) => a - b);

  // 5.6 — Se notifican las dos formas: el array (lo que usan las vistas
  // migradas) y `curso` con el primero, para que las vistas que todavía son de
  // un curso solo sigan funcionando. Si el consumidor todavía no implementa
  // `onCursosChange`, se cae al comportamiento anterior de un solo curso.
  const notificarSeleccion = (lista) => {
    if (onCursosChange) {
      onCursosChange(lista);
    } else if (onCursoChange) {
      onCursoChange(lista[0] || '');
    }
  };

  const handleAnioAcadChange = (e) => {
    const nuevoAnio = e.target.value;
    setAnioSeleccionado(nuevoAnio);
    if (!nuevoAnio) {
      notificarSeleccion([]);
      return;
    }
    // Al cambiar de año se marcan todas sus divisiones, que es lo que se
    // espera al abrir un año nuevo; si no hay ninguna, se deja en el año solo.
    const divsDelAnio = [
      ...new Set(
        partesPorCurso
          .filter((p) => p.anio === nuevoAnio)
          .map((p) => p.division)
          .filter(Boolean),
      ),
    ].sort((a, b) => a - b);
    notificarSeleccion(divsDelAnio.map((d) => `${nuevoAnio}°${d}`));
  };

  const handleDivisionToggle = (nombre, marcado) => {
    const siguiente = marcado
      ? [...cursosSeleccionados, nombre]
      : cursosSeleccionados.filter((c) => c !== nombre);
    // Orden estable por año y división para que la lista no cambie de orden
    // cada vez que se desmarca y remarks una.
    const ordenadas = [...siguiente].sort((a, b) => {
      const pa = parseCurso(a);
      const pb = parseCurso(b);
      const da = pa.anio ?? 0;
      const db = pb.anio ?? 0;
      if (da !== db) return da - db;
      return String(pa.division ?? '').localeCompare(String(pb.division ?? ''), 'es', { numeric: true });
    });
    notificarSeleccion(ordenadas);
  };

  const tieneFiltros = !!(anioLectivoLocal || cursoLocal || cursosSeleccionados.length > 0);

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
            Panel de Administración Escolar
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
              onChange={(e) => onAnioChange?.(e.target.value)}
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

          {/* 5.6 — División pasó a ser un grupo de checkboxes para poder elegir
              varias divisiones del mismo año. El Año y el Año lectivo siguen
              siendo <select>, como pidió el usuario. */}
          <div className="selector-group selector-group--checkboxes">
            <span className="selector-label" id="global-division-label">
              <i className="fas fa-users" aria-hidden="true" /> División
            </span>
            <div
              className="division-checkboxes"
              role="group"
              aria-labelledby="global-division-label"
            >
              {anioActual && divisionesDisponibles.length > 0 ? (
                divisionesDisponibles.map((d) => {
                  const nombre = `${anioActual}°${d}`;
                  return (
                    <label
                      key={d}
                      className="division-checkbox"
                      title={nombre}
                    >
                      <input
                        type="checkbox"
                        name="global-division"
                        value={nombre}
                        checked={cursosSeleccionados.includes(nombre)}
                        onChange={(e) => handleDivisionToggle(nombre, e.target.checked)}
                      />
                      <span>{d}</span>
                    </label>
                  );
                })
              ) : (
                <span className="division-checkboxes__placeholder">
                  {anioActual ? 'Sin divisiones' : 'Elegí un año...'}
                </span>
              )}
            </div>
          </div>

          {tieneFiltros && (
            <button
              type="button"
              className="btn-clear-selection"
              onClick={() => {
                onAnioChange?.('');
                notificarSeleccion([]);
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