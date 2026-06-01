import { useData } from '../../context/DataContext';
import { parseCurso, orientacionDeCurso } from '../../utils/orientacion';

function FiltrosAnioCurso({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const { aniosLectivos, cursosObj } = useData();

  // Cursos existentes para el ciclo lectivo seleccionado.
  const cursosDelCiclo = (cursosObj || []).filter(
    (c) => String(c.ciclo_anio) === String(anioLectivo),
  );

  // Años académicos (1-6) disponibles según los cursos del ciclo.
  const aniosDisponibles = [
    ...new Set(
      cursosDelCiclo
        .map((c) => parseCurso(c.nombre_curso).anio)
        .filter((a) => a),
    ),
  ].sort((a, b) => a - b);

  const { anio: anioActual, division: divActual } = parseCurso(curso);

  // Divisiones (1-3) disponibles para el año académico seleccionado.
  const divisionesDisponibles = [
    ...new Set(
      cursosDelCiclo
        .map((c) => parseCurso(c.nombre_curso))
        .filter((p) => p.anio === anioActual)
        .map((p) => p.division)
        .filter((d) => d),
    ),
  ].sort((a, b) => a - b);

  const handleAnioAcadChange = (nuevoAnio) => {
    // Al cambiar de año, se resetea la división (curso queda como "N°").
    onCursoChange(nuevoAnio ? `${nuevoAnio}°` : '');
  };

  const handleDivisionChange = (nuevaDiv) => {
    if (!anioActual || !nuevaDiv) {
      onCursoChange(anioActual ? `${anioActual}°` : '');
      return;
    }
    onCursoChange(`${anioActual}°${nuevaDiv}`);
  };

  const cursoCompleto = anioActual && divActual ? `${anioActual}°${divActual}` : '';
  const orientacion = cursoCompleto ? orientacionDeCurso(cursoCompleto) : '';

  return (
    <div className="filter-row">
      <div className="form-group-filter">
        <label htmlFor="preceptor-anio">Año lectivo</label>
        <select
          id="preceptor-anio"
          value={anioLectivo}
          onChange={(e) => onAnioChange(e.target.value)}
        >
          <option value="">Seleccione año...</option>
          {aniosLectivos.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group-filter">
        <label htmlFor="preceptor-anio-acad">Año</label>
        <select
          id="preceptor-anio-acad"
          value={anioActual || ''}
          onChange={(e) => handleAnioAcadChange(e.target.value)}
          disabled={!anioLectivo}
        >
          <option value="">Año...</option>
          {aniosDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}°
            </option>
          ))}
        </select>
      </div>

      <div className="form-group-filter">
        <label htmlFor="preceptor-division">División</label>
        <select
          id="preceptor-division"
          value={divActual || ''}
          onChange={(e) => handleDivisionChange(e.target.value)}
          disabled={!anioActual}
        >
          <option value="">División...</option>
          {divisionesDisponibles.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {orientacion && (
        <div className="form-group-filter filtro-orientacion">
          <label>Orientación</label>
          <span className="badge orientacion-badge">{orientacion}</span>
        </div>
      )}
    </div>
  );
}

export default FiltrosAnioCurso;
