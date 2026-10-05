import { useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { aListaCursos } from './preceptorUtils';

// Año lectivo y curso NO se seleccionan acá: vienen del filtro global del header
// de cada dashboard. Esta vista solo agrega el filtro propio de materia, que
// depende del curso global ya elegido.
function FiltrosDocentesVista({ cursos = [], materia, onMateria }) {
  const data = useData();
  const materiasPorCurso = data?.materiasPorCurso ?? {};
  const materias = data?.materias ?? [];

  const cursosSeleccionados = useMemo(() => aListaCursos(cursos), [cursos]);

  const materiasDisponibles = useMemo(() => {
    if (cursosSeleccionados.length === 0) return materias;
    const todas = cursosSeleccionados.flatMap((c) => materiasPorCurso[c] ?? []);
    return [...new Set(todas)].sort((a, b) => String(a).localeCompare(String(b)));
  }, [cursosSeleccionados, materiasPorCurso, materias]);

  // Si al cambiar el curso global la materia elegida ya no existe, se limpia
  // para no dejar el listado de docentes filtrado por algo invisible.
  useEffect(() => {
    if (materia && !materiasDisponibles.includes(materia)) onMateria('');
  }, [materia, materiasDisponibles, onMateria]);

  return (
    <div className="filter-row">
      <div className="form-group-filter">
        <label htmlFor="docentes-materia">Materia</label>
        <select
          id="docentes-materia"
          value={materia}
          onChange={(e) => onMateria(e.target.value)}
          disabled={cursosSeleccionados.length === 0}
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