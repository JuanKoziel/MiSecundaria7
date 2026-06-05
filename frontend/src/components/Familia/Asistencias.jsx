import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';

function badgeClass(estado) {
  if (estado === 'Presente') return 'badge-presente';
  if (estado === 'Ausente') return 'badge-ausente';
  return 'badge-tarde';
}

function Asistencias({ hijo }) {
  const { asistenciasFamilia } = useData();
  const [tipo, setTipo] = useState(() => {
    const saved = sessionStorage.getItem('familia_asistencia_tipo');
    return saved || 'general';
  });

  useEffect(() => {
    sessionStorage.setItem('familia_asistencia_tipo', tipo);
  }, [tipo]);

  const asistencias = asistenciasFamilia
    .filter((a) => a.hijoId === hijo.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const asistenciasFiltradas = useMemo(() => {
    if (tipo === 'general') {
      return asistencias.filter(a => a.tipo === 'general');
    }
    return asistencias.filter(a => a.tipo === 'materia');
  }, [asistencias, tipo]);

  const historialPorDia = useMemo(() => {
    const fechasUnicas = [...new Set(asistencias.filter(a => a.tipo === 'general').map(a => a.fecha))];
    return fechasUnicas.map(fecha => {
      const asistenciasFecha = asistencias.filter(a => a.fecha === fecha && a.tipo === 'general');
      const presentes = asistenciasFecha.filter(a => a.estado === 'Presente').length;
      const ausentes = asistenciasFecha.filter(a => a.estado === 'Ausente').length;
      const estadoGeneral = presentes > ausentes ? 'Bueno' : presentes < ausentes ? 'Atención' : 'Regular';
      return {
        fecha,
        curso: hijo.curso || '—',
        presentes,
        ausentes,
        estadoGeneral
      };
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [asistencias, hijo]);

  const historialPorMateria = useMemo(() => {
    return asistencias
      .filter(a => a.tipo === 'materia')
      .map(a => ({
        fecha: a.fecha,
        curso: hijo.curso || '—',
        materia: a.materia || '—',
        modulo: a.numero_modulo ? `Módulo ${a.numero_modulo}` : '—',
        docente: a.docente_nombre || '—',
        estado: a.estado
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [asistencias, hijo]);

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Historial de Asistencias — {hijo.nombre}</h3>
      </div>

      <div className="asist-tipo-selector">
        <button
          type="button"
          className={`btn btn-sm ${tipo === 'general' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTipo('general')}
        >
          Asistencia por Día
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tipo === 'materia' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTipo('materia')}
        >
          Asistencia por Materia
        </button>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header-flex">
          <h3>Historial</h3>
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
