import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  return 'badge-tarde';
}

function Asistencias() {
  const {
    alumnos,
    asistenciasAdmin,
    cursos,
    getHorarioClase,
    getMateriasByCurso,
    nombreCorto,
  } = useData();

  const [curso, setCurso] = useState('1°1');
  const materiasCurso = useMemo(() => getMateriasByCurso(curso), [curso, getMateriasByCurso]);
  const [materia, setMateria] = useState('Matemática');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const handleCursoChange = (nuevoCurso) => {
    setCurso(nuevoCurso);
    const materias = getMateriasByCurso(nuevoCurso);
    setMateria(materias[0] ?? '');
  };

  const registros = useMemo(() => {
    const filtrados = asistenciasAdmin.filter(
      (a) => a.curso === curso && a.materia === materia && a.fecha === fecha
    );
    const alumnosCurso = alumnos.filter((a) => a.curso === curso);
    const horario = getHorarioClase(materia);

    return alumnosCurso.map((alumno) => {
      const registro = filtrados.find((r) => r.alumnoId === alumno.id);
      return {
        alumnoId: alumno.id,
        nombre: nombreCorto(alumno),
        horario,
        estado: registro?.estado ?? 'Sin registro',
      };
    });
  }, [curso, materia, fecha, asistenciasAdmin, alumnos, getHorarioClase, nombreCorto]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Control de Asistencia</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <div className="filter-row">
        <div className="form-group-filter">
          <label htmlFor="curso-asistencias">Curso</label>
          <select
            id="curso-asistencias"
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
          <label htmlFor="materia-asistencias">Materia</label>
          <select
            id="materia-asistencias"
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
        <div className="form-group-filter">
          <label htmlFor="fecha-asistencias">Fecha</label>
          <input
            id="fecha-asistencias"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Horario</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state-message">
                  No hay alumnos en este curso.
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr key={r.alumnoId}>
                  <td className="table-cell-strong">{r.nombre}</td>
                  <td>{r.horario}</td>
                  <td>
                    <span
                      className={`badge ${
                        r.estado === 'Sin registro' ? '' : badgeClass(r.estado)
                      }`}
                    >
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Asistencias;
