import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import FiltrosAnioCurso from '../Shared/FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import { alumnosPorAnioYCurso, boletinPorAlumno, filtrosCompletos } from './preceptorUtils';
import { boletinHTML, exportarBoletinPDF } from '../../utils/boletin';
import { useBoletinAcademico } from '../../hooks/useBoletinAcademico';
import BoletinExtras from '../BoletinExtras';
import BoletinTablaPrincipal from '../BoletinTablaPrincipal';

function totalesInasistencias(inasistenciasPorMateria) {
  return Object.values(inasistenciasPorMateria).reduce(
    (acc, m) => ({ ausencias: acc.ausencias + m.ausencias, tardanzas: acc.tardanzas + m.tardanzas }),
    { ausencias: 0, tardanzas: 0 },
  );
}

function BoletinAlumno({ alumno, curso, anioLectivo, expandido, onToggle, inasistenciasPorMateria }) {
  const { nombreCorto, hijosFamilia, calificacionesFamilia, materiasPorCurso } = useData();
  const materiasConNotas = boletinPorAlumno(alumno.id, curso, hijosFamilia, calificacionesFamilia);
  const gradesByMateria = {};
  materiasConNotas.forEach((m) => { gradesByMateria[m.materia] = m; });
  const materiasDelCurso = materiasPorCurso[curso] || [];
  const materias = materiasDelCurso.map((nombre, idx) => {
    if (gradesByMateria[nombre]) return gradesByMateria[nombre];
    return { id: idx + 1, materia: nombre, prenota1: '', nota1: '', prenota2: '', nota2: '', diagnostico: '' };
  });
  const totales = totalesInasistencias(inasistenciasPorMateria);
  const {
    intensificaciones_1c,
    bloqueos_por_materia,
    intensificaciones_posteriores,
    recursadas,
    previas,
    loading,
  } = useBoletinAcademico(alumno.id);

  const handleExportar = (e) => {
    e.stopPropagation();
    const html = boletinHTML({
      alumnoNombre: `${alumno.apellido}, ${alumno.nombre}`,
      dni: alumno.dni,
      cursoNombre: curso,
      anioLectivo,
      materias,
      inasistenciasPorMateria,
      intensificaciones_1c,
      bloqueos_por_materia,
      intensificaciones_posteriores,
      recursadas,
      previas,
    });
    exportarBoletinPDF(html, `Boletín — ${alumno.apellido}, ${alumno.nombre}`);
  };

  return (
    <div className="preceptor-boletin-card">
      <div
        className="preceptor-boletin-header"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
      >
        <span>
          Boletín de {nombreCorto(alumno)}
          <span className="preceptor-boletin-meta">
            {' '}
            — {materias.length} materia{materias.length !== 1 ? 's' : ''} — Inasist: {totales.ausencias} | Tardanzas: {totales.tardanzas}
          </span>
        </span>
        <span className="preceptor-boletin-actions">
          <button type="button" className="btn btn-sm btn-secondary" onClick={handleExportar}>
            <i className="fas fa-file-pdf" aria-hidden="true" /> Exportar
          </button>
          <i
            className={`fas fa-chevron-${expandido ? 'up' : 'down'}`}
            aria-hidden="true"
          />
        </span>
      </div>

      {expandido && (
        <div className="preceptor-boletin-body">
          <BoletinTablaPrincipal
            materias={materias}
            intensificaciones_1c={intensificaciones_1c}
            bloqueos_por_materia={bloqueos_por_materia}
          />
          <div className="boletin-firma-sello">
            <span>Firma y sello</span>
          </div>

          <BoletinExtras
            recursadas={recursadas}
            previas={previas}
            intensificaciones_posteriores={intensificaciones_posteriores}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

function Notas({ anioLectivo, curso, onAnioChange, onCursoChange }) {
  const { inscripciones, alumnos, asistenciasAdmin } = useData();
  const [expandidoId, setExpandidoId] = useState(null);

  const lista = alumnosPorAnioYCurso(anioLectivo, curso, inscripciones, alumnos);

  const inasistenciasPorAlumno = useMemo(() => {
    const map = {};
    lista.forEach((a) => {
      const porMateria = {};
      asistenciasAdmin
        .filter((r) => r.alumnoId === a.id && (r.estado === 'Ausente' || r.estado === 'Tarde'))
        .forEach((r) => {
          const mat = r.materia || 'General';
          if (!porMateria[mat]) porMateria[mat] = { ausencias: 0, tardanzas: 0 };
          if (r.estado === 'Ausente') porMateria[mat].ausencias += 1;
          else porMateria[mat].tardanzas += 1;
        });
      map[a.id] = porMateria;
    });
    return map;
  }, [lista, asistenciasAdmin]);

  if (!filtrosCompletos(anioLectivo, curso)) {
    return (
      <div>
        <div className="card">
          <FiltrosAnioCurso
            anioLectivo={anioLectivo}
            curso={curso}
            onAnioChange={onAnioChange}
            onCursoChange={onCursoChange}
          />
        </div>
        <EmptyFiltros />
      </div>
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
      </div>

      <p className="preceptor-modo-hint">
        Vista consolidada por estudiante. Cada boletín tiene su propio botón <strong>Exportar</strong>
        {' '}para descargar/imprimir el PDF individual.
      </p>

      <div>
        {lista.length === 0 ? (
          <EmptyFiltros mensaje="No hay alumnos inscriptos en este curso." />
        ) : (
          lista.map((a) => (
            <BoletinAlumno
              key={a.id}
              alumno={a}
              curso={curso}
              anioLectivo={anioLectivo}
              expandido={expandidoId === a.id}
              onToggle={() => setExpandidoId(expandidoId === a.id ? null : a.id)}
              inasistenciasPorMateria={inasistenciasPorAlumno[a.id] || {}}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Notas;
