import { useMemo, useState } from 'react';
import {
  alumnos,
  cursos,
  getMateriasByCurso,
  nombreCorto,
  notasDocenteAdmin,
} from '../../data/mockData';

function Notas() {
  const [curso, setCurso] = useState('1°1');
  const materiasCurso = useMemo(() => getMateriasByCurso(curso), [curso]);
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
  }, [curso, materia]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones cargadas por el docente</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <div className="filter-row">
        <div className="form-group-filter">
          <label htmlFor="curso-notas">Curso</label>
          <select
            id="curso-notas"
            value={curso}
            onChange={(e) => handleCursoChange(e.target.value)}
          >
            {cursos.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
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
              <th>Alumno</th>
              <th>Prenota 1</th>
              <th>Nota 1</th>
              <th>Prenota 2</th>
              <th>Nota 2</th>
              <th>Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {planilla.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state-message">
                  No hay alumnos en este curso.
                </td>
              </tr>
            ) : (
              planilla.map((fila) => (
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
                  <td>{fila.diagnostico}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Notas;
