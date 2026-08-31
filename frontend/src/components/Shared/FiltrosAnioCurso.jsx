import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { parseCurso, orientacionDeCurso } from '../../utils/orientacion';
import {
  findCursoObj,
  getAniosCurso,
  getAniosLectivos,
  getCursoParts,
  getDivisiones,
} from './cursoFilters';

function FiltrosControlado({ aniosLectivos, cursosObj, anioLectivo, curso, onAnioChange, onCursoChange }) {
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

function FiltrosAutonomo({ cursosObj, onCursoChange, onCursoObjChange, defaultToFirst, className }) {
  const [anioLectivo, setAnioLectivo] = useState('');
  const [anioCurso, setAnioCurso] = useState('');
  const [division, setDivision] = useState('');

  const aniosLectivos = useMemo(() => getAniosLectivos(cursosObj), [cursosObj]);
  const aniosCurso = useMemo(() => getAniosCurso(cursosObj, anioLectivo), [cursosObj, anioLectivo]);
  const divisiones = useMemo(
    () => getDivisiones(cursosObj, anioLectivo, anioCurso),
    [cursosObj, anioLectivo, anioCurso],
  );

  useEffect(() => {
    if (!cursosObj.length) return;
    if (!defaultToFirst && !anioLectivo && !anioCurso && !division) {
      onCursoChange?.('');
      onCursoObjChange?.(null);
      return;
    }
    if (defaultToFirst && !anioLectivo && !anioCurso && !division) {
      const first = cursosObj[0];
      const parts = getCursoParts(first);
      setAnioLectivo(parts.anioLectivo);
      setAnioCurso(parts.anioCurso);
      setDivision(parts.division);
    }
  }, [cursosObj, defaultToFirst, anioLectivo, anioCurso, division, onCursoChange, onCursoObjChange]);

  useEffect(() => {
    const cursoObj = findCursoObj(cursosObj, anioLectivo, anioCurso, division);
    onCursoChange?.(cursoObj?.nombre_curso || '');
    onCursoObjChange?.(cursoObj || null);
  }, [cursosObj, anioLectivo, anioCurso, division, onCursoChange, onCursoObjChange]);

  return (
    <div className={`filter-row ${className}`.trim()}>
      <div className="form-group-filter">
        <label htmlFor="anio-lectivo-select">Año lectivo</label>
        <select
          id="anio-lectivo-select"
          value={anioLectivo}
          onChange={(e) => {
            setAnioLectivo(e.target.value);
            setAnioCurso('');
            setDivision('');
          }}
        >
          <option value="">Seleccionar...</option>
          {aniosLectivos.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group-filter">
        <label htmlFor="anio-curso-select">Año</label>
        <select
          id="anio-curso-select"
          value={anioCurso}
          onChange={(e) => {
            setAnioCurso(e.target.value);
            setDivision('');
          }}
          disabled={!anioLectivo}
        >
          <option value="">Seleccionar...</option>
          {aniosCurso.map((anio) => (
            <option key={anio} value={anio}>
              {anio}°
            </option>
          ))}
        </select>
      </div>

      <div className="form-group-filter">
        <label htmlFor="division-select">División</label>
        <select
          id="division-select"
          value={division}
          onChange={(e) => setDivision(e.target.value)}
          disabled={!anioCurso}
        >
          <option value="">Seleccionar...</option>
          {divisiones.map((div) => (
            <option key={div} value={div}>
              {div}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function FiltrosAnioCurso(props) {
  const data = useData();
  const esControlado = props.anioLectivo !== undefined || props.onAnioChange !== undefined;

  if (esControlado) {
    return (
      <FiltrosControlado
        aniosLectivos={props.aniosLectivos ?? data?.aniosLectivos ?? []}
        cursosObj={props.cursosObj ?? data?.cursosObj ?? []}
        anioLectivo={props.anioLectivo}
        curso={props.curso}
        onAnioChange={props.onAnioChange}
        onCursoChange={props.onCursoChange}
      />
    );
  }

  return (
    <FiltrosAutonomo
      cursosObj={props.cursosObj ?? []}
      onCursoChange={props.onCursoChange}
      onCursoObjChange={props.onCursoObjChange}
      defaultToFirst={props.defaultToFirst}
      className={props.className}
    />
  );
}
