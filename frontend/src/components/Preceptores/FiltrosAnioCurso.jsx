import { aniosLectivos } from '../../data/mockData';
import { cursosPorAnio } from './preceptorUtils';

function FiltrosAnioCurso({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const cursosFiltrados = cursosPorAnio(anioLectivo);

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
        <label htmlFor="preceptor-curso">Curso</label>
        <select
          id="preceptor-curso"
          value={curso}
          onChange={(e) => onCursoChange(e.target.value)}
          disabled={!anioLectivo}
        >
          <option value="">Seleccione curso...</option>
          {cursosFiltrados.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default FiltrosAnioCurso;
