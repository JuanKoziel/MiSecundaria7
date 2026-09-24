import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import EmptyFiltros from './EmptyFiltros';
import { estudiantesPorAnioYCurso, ritePorEstudiante, filtrosCompletos } from './preceptorUtils';
import { riteHTML, exportarRitePDF } from '../../utils/rite';
import { useRiteAcademico } from '../../hooks/useRiteAcademico';
import RiteExtras from '../RiteExtras';
import RiteTablaPrincipal from '../RiteTablaPrincipal';

function totalesInasistencias(inasistenciasPorMateria) {
  return Object.values(inasistenciasPorMateria).reduce(
    (acc, m) => ({ ausencias: acc.ausencias + m.ausencias, tardanzas: acc.tardanzas + m.tardanzas }),
    { ausencias: 0, tardanzas: 0 },
  );
}

function RiteEstudiante({ estudiante, curso, anioLectivo, expandido, onToggle, inasistenciasPorMateria }) {
  const { nombreCorto, hijosFamilia, calificacionesFamilia, materiasPorCurso } = useData();
  const materiasConNotas = ritePorEstudiante(estudiante.id, curso, hijosFamilia, calificacionesFamilia);
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
  } = useRiteAcademico(estudiante.id);

  const handleExportar = (e) => {
    e.stopPropagation();
    const html = riteHTML({
      estudianteNombre: `${estudiante.apellido}, ${estudiante.nombre}`,
      dni: estudiante.dni,
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
    exportarRitePDF(html, `RITE — ${estudiante.apellido}, ${estudiante.nombre}`);
  };

  return (
    <div className="preceptor-rite-card">
      <div
        className="preceptor-rite-header"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
      >
        <span>
          RITE de {nombreCorto(estudiante)}
          <span className="preceptor-rite-meta">
            {' '}
            — {materias.length} materia{materias.length !== 1 ? 's' : ''} — Inasist: {totales.ausencias} | Tardanzas: {totales.tardanzas}
          </span>
        </span>
        <span className="preceptor-rite-actions">
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
        <div className="preceptor-rite-body">
          <RiteTablaPrincipal
            materias={materias}
            intensificaciones_1c={intensificaciones_1c}
            bloqueos_por_materia={bloqueos_por_materia}
            intensificaciones_posteriores={intensificaciones_posteriores}
          />
          <div className="rite-firma-sello">
            <span>Firma y sello</span>
          </div>

          <RiteExtras
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
  const { inscripciones, estudiantes, asistenciasAdmin } = useData();
  const [expandidoId, setExpandidoId] = useState(null);

  const lista = estudiantesPorAnioYCurso(anioLectivo, curso, inscripciones, estudiantes);

  const inasistenciasPorEstudiante = useMemo(() => {
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
        <EmptyFiltros />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>
          <i className="fas fa-file-alt" aria-hidden="true" /> RITE del curso
        </h3>
      </div>

      <p className="preceptor-modo-hint">
        Vista consolidada por estudiante. Cada RITE tiene su propio botón <strong>Exportar</strong>
        {' '}para descargar/imprimir el PDF individual.
      </p>

      <div>
        {lista.length === 0 ? (
          <EmptyFiltros mensaje="No hay estudiantes inscriptos en este curso." />
        ) : (
          lista.map((a) => (
            <RiteEstudiante
              key={a.id}
              estudiante={a}
              curso={curso}
              anioLectivo={anioLectivo}
              expandido={expandidoId === a.id}
              onToggle={() => setExpandidoId(expandidoId === a.id ? null : a.id)}
              inasistenciasPorMateria={inasistenciasPorEstudiante[a.id] || {}}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Notas;
