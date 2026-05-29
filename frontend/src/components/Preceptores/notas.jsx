import { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, boletinPorAlumno, filtrosCompletos } from './preceptorUtils';

function BoletinAlumno({ alumno, curso, expandido, onToggle, inasistencias }) {
  const { nombreCorto, hijosFamilia, calificacionesFamilia } = useData();
  const materias = boletinPorAlumno(alumno.id, curso, hijosFamilia, calificacionesFamilia);

  return (
    <div className="preceptor-boletin-card">
      <button type="button" className="preceptor-boletin-header" onClick={onToggle}>
        <span>
          Boletín de {nombreCorto(alumno)}
          <span className="preceptor-boletin-meta">
            {' '}
            — {materias.length} materia{materias.length !== 1 ? 's' : ''} — Inasist: {inasistencias.ausencias} | Tardanzas: {inasistencias.tardanzas}
          </span>
        </span>
        <i
          className={`fas fa-chevron-${expandido ? 'up' : 'down'}`}
          aria-hidden="true"
        />
      </button>

      {expandido && (
        <div className="preceptor-boletin-body">
          {materias.length === 0 ? (
            <p className="empty-state-message">Sin calificaciones cargadas.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th rowSpan={2}>Materia</th>
                    <th colSpan={3}>1° Cuatrimestre</th>
                    <th colSpan={3}>2° Cuatrimestre</th>
                    <th rowSpan={2}>Diagnóstico</th>
                  </tr>
                  <tr>
                    <th>Prenota</th>
                    <th>Nota</th>
                    <th>Inasist.</th>
                    <th>Prenota</th>
                    <th>Nota</th>
                    <th>Inasist.</th>
                  </tr>
                </thead>
                <tbody>
                  {materias.map((m) => (
                    <tr key={m.id}>
                      <td className="table-cell-strong">{m.materia}</td>
                      <td>
                        <span className="badge badge-cualitativa">{m.prenota1 || '—'}</span>
                      </td>
                      <td>{m.nota1 ?? '—'}</td>
                      <td>{inasistencias.ausencias}</td>
                      <td>
                        <span className="badge badge-cualitativa">{m.prenota2 || '—'}</span>
                      </td>
                      <td>{m.nota2 ?? '—'}</td>
                      <td>{inasistencias.ausencias}</td>
                      <td>{m.diagnostico || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Notas({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const { inscripciones, alumnos, asistenciasAdmin, nombreCorto } = useData();
  const [expandidoId, setExpandidoId] = useState(null);
  const printRef = useRef(null);

  const lista = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);

  const inasistenciasPorAlumno = useMemo(() => {
    const map = {};
    lista.forEach((a) => {
      const asistAlumno = asistenciasAdmin.filter((r) => r.alumnoId === a.id);
      map[a.id] = {
        ausencias: asistAlumno.filter((r) => r.estado === 'Ausente').length,
        tardanzas: asistAlumno.filter((r) => r.estado === 'Tarde').length,
      };
    });
    return map;
  }, [lista, asistenciasAdmin]);

  const handleExportarPDF = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Boletines — ${curso} (${anioLectivo})</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 13px; }
        th { background: #f5f5f5; }
        h2, h3 { margin: 10px 0; }
        .alumno-header { background: #e3f2fd; padding: 8px 12px; margin-top: 16px; border-radius: 4px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h2>Boletines del curso ${curso} — Año lectivo ${anioLectivo}</h2>
      ${el.innerHTML}
      <script>window.print();<\/script>
      </body></html>
    `);
    win.document.close();
  };

  if (!filtrosCompletos(anioLectivo, curso)) {
    return (
      <>
        <div className="card">
          <FiltrosAnioCurso
            anioLectivo={anioLectivo}
            curso={curso}
            onAnioChange={onAnioChange}
            onCursoChange={onCursoChange}
          />
        </div>
        <EmptyFiltros />
      </>
    );
  }

  return (
    <div className="card">
      <FiltrosAnioCurso
        anioLectivo={anioLectivo}
        curso={curso}
        onAnioChange={onAnioChange}
        onCursoChange={onCursoChange}
      />

      <div className="card-header-flex">
        <h3>
          Boletines del curso — {curso} ({anioLectivo})
        </h3>
        <button type="button" className="btn btn-secondary" onClick={handleExportarPDF}>
          <i className="fas fa-file-pdf" aria-hidden="true" /> Exportar PDF
        </button>
      </div>

      <p className="preceptor-modo-hint">
        Vista consolidada por alumno. Las calificaciones por materia las cargan los
        docentes; desde preceptoría podés consultar el boletín completo del curso.
      </p>

      <div ref={printRef}>
        {lista.length === 0 ? (
          <EmptyFiltros mensaje="No hay alumnos inscriptos en este curso." />
        ) : (
          lista.map((a) => (
            <BoletinAlumno
              key={a.id}
              alumno={a}
              curso={curso}
              expandido={expandidoId === a.id}
              onToggle={() => setExpandidoId(expandidoId === a.id ? null : a.id)}
              inasistencias={inasistenciasPorAlumno[a.id] || { ausencias: 0, tardanzas: 0 }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Notas;
