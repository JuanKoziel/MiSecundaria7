import { useEffect, useMemo, useState } from 'react';
import {
  findCursoObj,
  getAniosCurso,
  getAniosLectivos,
  getCursoParts,
  getDivisiones,
} from './cursoFilters';

function FiltrosAnioCurso({
  cursosObj = [],
  onCursoChange,
  onCursoObjChange,
  defaultToFirst = false,
  className = '',
}) {
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

export default FiltrosAnioCurso;
