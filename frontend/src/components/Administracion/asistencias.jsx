import { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from './FiltrosAnioCurso';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  return 'badge-tarde';
}

function Asistencias() {
  const {
    alumnos,
    asistenciasAdmin,
    cursosObj,
    getMateriasByCurso,
    nombreCorto,
  } = useData();

  const [curso, setCurso] = useState('1°1');
  const [tipo, setTipo] = useState(() => {
    const saved = sessionStorage.getItem('admin_asistencia_tipo');
    return saved || 'general';
  });
  const materiasCurso = useMemo(() => getMateriasByCurso(curso), [curso, getMateriasByCurso]);
  const [materia, setMateria] = useState('Matemática');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    sessionStorage.setItem('admin_asistencia_tipo', tipo);
  }, [tipo]);

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

  const historialPorDia = useMemo(() => {
    const fechasUnicas = [...new Set(asistenciasAdmin.filter(a => a.curso === curso).map(a => a.fecha))];
    return fechasUnicas.map(fecha => {
      const asistenciasFecha = asistenciasAdmin.filter(a => a.curso === curso && a.fecha === fecha && a.tipo === 'general');
      const presentes = asistenciasFecha.filter(a => a.estado === 'Presente').length;
      const ausentes = asistenciasFecha.filter(a => a.estado === 'Ausente').length;
      const estadoGeneral = presentes > ausentes ? 'Bueno' : presentes < ausentes ? 'Atención' : 'Regular';
      return {
        fecha,
        curso,
        presentes,
        ausentes,
        estadoGeneral
      };
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [asistenciasAdmin, curso]);

  const historialPorMateria = useMemo(() => {
    return asistenciasAdmin
      .filter(a => a.curso === curso && a.tipo === 'materia')
      .map(a => ({
        fecha: a.fecha,
        curso: a.curso,
        materia: a.materia,
        modulo: a.numero_modulo ? `Módulo ${a.numero_modulo}` : '—',
        docente: a.docente_nombre || '—',
        estado: a.estado
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [asistenciasAdmin, curso]);

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

      <FiltrosAnioCurso
        cursosObj={cursosObj}
        defaultToFirst
        onCursoChange={(nuevoCurso) => handleCursoChange(nuevoCurso)}
      />
      <div className="filter-row">
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

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header-flex">
          <h3>Historial de Asistencias</h3>
        </div>

        {tipo === 'general' ? (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Curso</th>
                  <th>Presentes</th>
                  <th>Ausentes</th>
                  <th>Estado General</th>
                </tr>
              </thead>
              <tbody>
                {historialPorDia.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state-message">
                      No hay registros de historial por día.
                    </td>
                  </tr>
                ) : (
                  historialPorDia.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.fecha}</td>
                      <td>{h.curso}</td>
                      <td>{h.presentes}</td>
                      <td>{h.ausentes}</td>
                      <td>
                        <span className={`badge ${h.estadoGeneral === 'Bueno' ? 'badge-presente' : h.estadoGeneral === 'Atención' ? 'badge-ausente' : 'badge-tarde'}`}>
                          {h.estadoGeneral}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Curso</th>
                  <th>Materia</th>
                  <th>Módulo</th>
                  <th>Docente</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historialPorMateria.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state-message">
                      No hay registros de historial por materia.
                    </td>
                  </tr>
                ) : (
                  historialPorMateria.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.fecha}</td>
                      <td>{h.curso}</td>
                      <td>{h.materia}</td>
                      <td>{h.modulo}</td>
                      <td>{h.docente}</td>
                      <td>
                        <span className={`badge ${badgeClass(h.estado)}`}>
                          {h.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Asistencias;
