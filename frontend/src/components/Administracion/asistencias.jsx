import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { cursoConOrientacion } from '../../utils/orientacion';

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
    getMateriasByCurso,
    nombreCorto,
  } = useData();

  const [curso, setCurso] = useState('1°1');
  const [tipo, setTipo] = useState('general');
  const materiasCurso = useMemo(() => getMateriasByCurso(curso), [curso, getMateriasByCurso]);
  const [materia, setMateria] = useState('Matemática');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const handleCursoChange = (nuevoCurso) => {
    setCurso(nuevoCurso);
    const materias = getMateriasByCurso(nuevoCurso);
    setMateria(materias[0] ?? '');
  };

  const registros = useMemo(() => {
    const alumnosCurso = alumnos.filter((a) => a.curso === curso);
    const filtrados = asistenciasAdmin.filter((a) => {
      if (a.curso !== curso || a.fecha !== fecha) return false;
      if (tipo === 'general') return a.tipo === 'general';
      return a.tipo === 'materia' && a.materia === materia;
    });

    return alumnosCurso.map((alumno) => {
      const registro = filtrados.find((r) => r.alumnoId === alumno.id);
      return {
        alumnoId: alumno.id,
        nombre: nombreCorto(alumno),
        modulo: registro?.numero_modulo ? `Módulo ${registro.numero_modulo}` : '—',
        estado: registro?.estado ?? 'Sin registro',
      };
    });
  }, [curso, materia, fecha, tipo, asistenciasAdmin, alumnos, nombreCorto]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Control de Asistencia</h3>
        <span className="badge role-badge-display">Solo lectura</span>
      </div>

      <div className="asist-tipo-selector">
        <button
          type="button"
          className={`btn btn-sm ${tipo === 'general' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTipo('general')}
        >
          Asistencia General del Día
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tipo === 'materia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTipo('materia')}
        >
          Asistencia por Materia
        </button>
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
                {cursoConOrientacion(c)}
              </option>
            ))}
          </select>
        </div>
        {tipo === 'materia' && (
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
        )}
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
              {tipo === 'materia' && <th>Módulo</th>}
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={tipo === 'materia' ? 3 : 2} className="empty-state-message">
                  No hay alumnos en este curso.
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr key={r.alumnoId}>
                  <td className="table-cell-strong">{r.nombre}</td>
                  {tipo === 'materia' && <td>{r.modulo}</td>}
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
