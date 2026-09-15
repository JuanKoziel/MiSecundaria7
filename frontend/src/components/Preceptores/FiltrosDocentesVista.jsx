import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { cursosPorAnio } from './preceptorUtils';

function FiltrosDocentesVista({ anioLectivo, curso, materia, onAnio, onCurso, onMateria }) {
  const data = useData();
  const aniosLectivos = data?.aniosLectivos ?? [];
  const cursos = data?.cursos ?? [];
  const cursosObj = data?.cursosObj ?? [];
  const inscripciones = data?.inscripciones ?? [];
  const materiasPorCurso = data?.materiasPorCurso ?? {};
  const materias = data?.materias ?? [];

  const cursosDelAnio = useMemo(
    () => cursosPorAnio(anioLectivo, inscripciones, cursos, cursosObj),
    [anioLectivo, inscripciones, cursos, cursosObj],
  );

  const materiasDisponibles = curso ? materiasPorCurso[curso] ?? [] : materias;

  return (
    <div className="filter-row">
      <div className="form-group-filter">
        <label htmlFor="docentes-anio">Año lectivo</label>
        <select
          id="docentes-anio"
          value={anioLectivo}
          onChange={(e) => onAnio(e.target.value)}
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
        <label htmlFor="docentes-curso">Curso</label>
        <select
          id="docentes-curso"
          value={curso}
          onChange={(e) => onCurso(e.target.value)}
          disabled={!anioLectivo}
        >
          <option value="">Todos...</option>
          {cursosDelAnio.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group-filter">
        <label htmlFor="docentes-materia">Materia</label>
        <select
          id="docentes-materia"
          value={materia}
          onChange={(e) => onMateria(e.target.value)}
          disabled={!curso}
        >
          <option value="">Todas...</option>
          {materiasDisponibles.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default FiltrosDocentesVista;