import React from 'react';

function IntensificacionItem({ a }) {
  return (
    <li className="boletin-extra-item">
      <div className="boletin-extra-titulo">{a.titulo || 'Actividad de intensificación'}</div>
      <div className="boletin-extra-meta">
        {a.periodo_intensificacion && (
          <span className="badge badge-warning">{a.periodo_intensificacion}</span>
        )}
        {a.materia_nombre && <span className="text-muted">Materia: {a.materia_nombre}</span>}
        {a.docente_nombre && <span className="text-muted">Docente: {a.docente_nombre}</span>}
      </div>
      {a.archivo_pdf && (
        <a href={a.archivo_pdf} target="_blank" rel="noopener noreferrer" className="boletin-extra-link">
          <i className="fas fa-file-pdf" aria-hidden="true" /> Descargar archivo (PDF)
        </a>
      )}
    </li>
  );
}

function BloqueoItem({ b }) {
  const materia = b.materia_bloqueada_nombre || '—';
  const prioritaria = b.materia_prioritaria_nombre || b.materia_recursada_nombre || '—';
  return (
    <tr>
      <td className="table-cell-strong">{materia}</td>
      <td>{prioritaria}</td>
      <td>
        <span className={`badge ${b.estado ? 'badge-danger' : 'badge-secondary'}`}>
          {b.estado ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>{b.motivo || '—'}</td>
    </tr>
  );
}

function SituacionItem({ s }) {
  return (
    <tr>
      <td className="table-cell-strong">{s.materia_nombre || '—'}</td>
      <td>
        <span className={`badge ${s.situacion === 'LIBERADA' ? 'badge-success' : 'badge-danger'}`}>
          {s.situacion || '—'}
        </span>
      </td>
      <td>{s.observaciones || '—'}</td>
    </tr>
  );
}

export default function BoletinExtras({ intensificaciones = [], bloqueos = [], situaciones = [], loading }) {
  return (
    <div className="boletin-extras mt-16">
      <h4>Espacios de Intensificación</h4>
      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : intensificaciones.length === 0 ? (
        <p className="empty-state-message">Sin espacios de intensificación registrados.</p>
      ) : (
        <ul className="boletin-extra-lista">
          {intensificaciones.map((a) => (
            <IntensificacionItem key={a.id_actividad} a={a} />
          ))}
        </ul>
      )}

      <h4 className="mt-16">Bloqueos de Horario</h4>
      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : bloqueos.length === 0 ? (
        <p className="empty-state-message">Sin bloqueos de horario registrados.</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Materia bloqueada</th>
                <th>Prioritaria / Recursada</th>
                <th>Estado</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {bloqueos.map((b) => (
                <BloqueoItem key={b.id_bloqueo} b={b} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 className="mt-16">Situaciones de Materia</h4>
      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : situaciones.length === 0 ? (
        <p className="empty-state-message">Sin situaciones registradas.</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Situación</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {situaciones.map((s) => (
                <SituacionItem key={s.id_situacion} s={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
