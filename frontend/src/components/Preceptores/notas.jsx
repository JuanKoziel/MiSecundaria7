import { useState } from 'react';
import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, boletinPorAlumno, filtrosCompletos } from './preceptorUtils';

function BoletinAlumno({ alumno, curso, expandido, onToggle }) {
  const { nombreCorto, hijosFamilia, calificacionesFamilia } = useData();
  const materias = boletinPorAlumno(alumno.id, curso, hijosFamilia, calificacionesFamilia);

  return (
    <div className="preceptor-boletin-card">
      <button type="button" className="preceptor-boletin-header" onClick={onToggle}>
        <span>
          Boletín de {nombreCorto(alumno)}
          <span className="preceptor-boletin-meta">
            {' '}
            — {materias.length} materia{materias.length !== 1 ? 's' : ''}
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
                      <td>—</td>
                      <td>
                        <span className="badge badge-cualitativa">{m.prenota2 || '—'}</span>
                      </td>
                      <td>{m.nota2 ?? '—'}</td>
                      <td>—</td>
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
  const { inscripciones, alumnos } = useData();
  const [expandidoId, setExpandidoId] = useState(null);

  const lista = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);

  const handleGuardar = () => {
    alert(`Boletines consultados — ${curso} (${anioLectivo}).`);
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
        <button type="button" className="btn btn-secondary" onClick={handleGuardar}>
          <i className="fas fa-download" aria-hidden="true" /> Exportar
        </button>
      </div>

      <p className="preceptor-modo-hint">
        Vista consolidada por alumno. Las calificaciones por materia las cargan los
        docentes; desde preceptoría podés consultar el boletín completo del curso.
      </p>

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
          />
        ))
      )}
    </div>
  );
}

export default Notas;
