import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from '../Shared/FiltrosAnioCurso';

function Notas() {
  const {
    alumnos,
    cursosObj,
    getMateriasByCurso,
    nombreCorto,
    notasDocenteAdmin,
  } = useData();

  const [curso, setCurso] = useState('1°1');
  const materiasCurso = useMemo(() => getMateriasByCurso(curso), [curso, getMateriasByCurso]);
  const [materia, setMateria] = useState('Matemática');

  const handleCursoChange = (nuevoCurso) => {
    setCurso(nuevoCurso);
    const materias = getMateriasByCurso(nuevoCurso);
    setMateria(materias[0] ?? '');
  };

  const planilla = useMemo(() => {
    const alumnosCurso = alumnos.filter((a) => a.curso === curso);
    return alumnosCurso.map((alumno) => {
      const nota = notasDocenteAdmin.find(
        (n) => n.curso === curso && n.materia === materia && n.alumnoId === alumno.id
      );
      return {
        alumnoId: alumno.id,
        nombre: nombreCorto(alumno),
        prenota1: nota?.prenota1 ?? '—',
        nota1: nota?.nota1 ?? '—',
        prenota2: nota?.prenota2 ?? '—',
        nota2: nota?.nota2 ?? '—',
        diagnostico: nota?.diagnostico ?? 'Sin carga del docente',
      };
    });
  }, [curso, materia, alumnos, notasDocenteAdmin, nombreCorto]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones cargadas por el docente</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <FiltrosAnioCurso
        cursosObj={cursosObj}
        defaultToFirst
        onCursoChange={(nuevoCurso) => handleCursoChange(nuevoCurso)}
      />
      <div className="filter-row">
        <div className="form-group-filter">
          <label htmlFor="materia-notas">Materia</label>
          <select
            id="materia-notas"
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
          >
            {materiasCurso.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>Estudiante</th>
              <th colSpan={2}>1.º Cuatrimestre</th>
              <th colSpan={2}>2.º Cuatrimestre</th>
              <th rowSpan={2}>Calificación final</th>
              <th rowSpan={2}>Diagnóstico</th>
            </tr>
            <tr>
              <th>1.ª Valoración Preliminar</th>
              <th>Calificación</th>
              <th>2.ª Valoración Preliminar</th>
              <th>Calificación</th>
            </tr>
          </thead>
          <tbody>
            {planilla.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state-message">
                  No hay estudiantes en este curso.
                </td>
              </tr>
            ) : (
              planilla.map((fila) => {
                const n1 = parseFloat(fila.nota1);
                const n2 = parseFloat(fila.nota2);
                const nums = [n1, n2].filter((n) => !Number.isNaN(n));
                const califFinal = nums.length
                  ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
                  : '—';
                return (
                <tr key={fila.alumnoId}>
                  <td className="table-cell-strong">{fila.nombre}</td>
                  <td>
                    {fila.prenota1 !== '—' ? (
                      <span className="badge badge-cualitativa">{fila.prenota1}</span>
                    ) : (
                      fila.prenota1
                    )}
                  </td>
                  <td>{fila.nota1}</td>
                  <td>
                    {fila.prenota2 !== '—' ? (
                      <span className="badge badge-cualitativa">{fila.prenota2}</span>
                    ) : (
                      fila.prenota2
                    )}
                  </td>
                  <td>{fila.nota2}</td>
                  <td>{califFinal}</td>
                  <td>{fila.diagnostico}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Notas;
