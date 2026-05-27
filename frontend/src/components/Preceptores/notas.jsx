<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { fetchAlumnos, fetchNotasPreceptor, saveNotasPreceptorBulk } from '../../api/services';
import ApiError from '../common/ApiError';
import CursoFilter from './CursoFilter';
import { useCursos } from './useCursos';
=======
import { useState } from 'react';
import { nombreCorto } from '../../data/mockData';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, boletinPorAlumno, filtrosCompletos } from './preceptorUtils';
>>>>>>> main

function BoletinAlumno({ alumno, curso, expandido, onToggle }) {
  const materias = boletinPorAlumno(alumno.id, curso);

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

<<<<<<< HEAD
function Notas() {
  const { cursos, curso, setCurso, error: cursosError, loading: cursosLoading } = useCursos();
  const [alumnos, setAlumnos] = useState([]);
  const [notas, setNotas] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!curso) return;
    setLoading(true);
    setError('');
    Promise.all([fetchAlumnos(curso), fetchNotasPreceptor()])
      .then(([alumnosData, notasData]) => {
        setAlumnos(alumnosData);
        const map = {};
        const ids = new Set(alumnosData.map((a) => a.id));
        notasData.forEach((n) => {
          if (ids.has(n.alumno_id)) {
            map[n.alumno_id] = n.nota != null ? String(n.nota) : '';
          }
        });
        setNotas(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [curso]);
=======
function Notas({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const [expandidoId, setExpandidoId] = useState(null);
>>>>>>> main

  const lista = alumnosPorAnioYCurso(anioLectivo, curso);

  const handleGuardar = () => {
    alert(`Boletines consultados — ${curso} (${anioLectivo}).`);
  };

<<<<<<< HEAD
  const handleGuardar = async () => {
    setSaving(true);
    setError('');
    try {
      const items = alumnos.map((a) => ({
        alumno_id: a.id,
        nota: notas[a.id] === '' ? null : Number(notas[a.id]),
      }));
      await saveNotasPreceptorBulk(items);
      alert('Notas guardadas correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayError = cursosError || error;
=======
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
>>>>>>> main

  return (
    <div className="card">
      <FiltrosAnioCurso
        anioLectivo={anioLectivo}
        curso={curso}
        onAnioChange={onAnioChange}
        onCursoChange={onCursoChange}
      />

      <div className="card-header-flex">
<<<<<<< HEAD
        <h3>Calificaciones del Periodo</h3>
        <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={saving || !curso}>
          {saving ? 'Guardando...' : 'Guardar notas'}
        </button>
      </div>

      <CursoFilter cursos={cursos} value={curso} onChange={setCurso} id="curso-notas" />
      <ApiError message={displayError} />

      {cursosLoading || loading ? (
        <p className="empty-state-message">Cargando...</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th style={{ width: '150px' }}>Nota Final</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre} {a.apellido}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input-table input-table--wide"
                      value={notas[a.id] ?? ''}
                      onChange={(e) => handleChange(a.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
=======
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
>>>>>>> main
      )}
    </div>
  );
}

export default Notas;
