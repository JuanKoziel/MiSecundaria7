import { useData } from '../../context/DataContext';
import { boletinHTML, exportarBoletinPDF } from '../../utils/boletin';
import { useMemo } from 'react';

function Calificaciones({ hijo }) {
  const { calificacionesFamilia, materiasPorCurso, cursoMateria, periodos, asistenciasAdmin, alumnos } = useData();

  // Obtener el objeto real del alumno
  const alumno = alumnos.find((a) => a.id === hijo.alumnoId);

  // Obtener todas las materias del curso del hijo
  const cursoNombre = hijo.curso;
  const materiasDelCurso = materiasPorCurso[cursoNombre] || [];

  // Filtrar calificaciones para este hijo por alumnoId (no hijoId)
  const calificacionesHijo = calificacionesFamilia.filter((c) => c.alumnoId === hijo.alumnoId);

  // Construir un mapa de calificaciones existentes por ID de curso_materia
  const gradesMap = {};
  calificacionesHijo.forEach((c) => {
    const key = c.id_curso_materia;
    if (!gradesMap[key]) {
      gradesMap[key] = {
        materia: c.materia || 'Sin materia',
        curso: c.curso || '',
        prenota1: '', nota1: '', prenota2: '', nota2: '', diagnostico: '',
      };
    }
    // Como calificacionesFamilia ya tiene calificaciones agrupadas, usarlas directamente
    gradesMap[key].prenota1 = c.prenota1 || '';
    gradesMap[key].nota1 = c.nota1 ?? '';
    gradesMap[key].prenota2 = c.prenota2 || '';
    gradesMap[key].nota2 = c.nota2 ?? '';
    gradesMap[key].diagnostico = c.diagnostico || '';
  });

  // Construir la lista final desde todas las materias del curso
  const calificacionesDisplay = materiasDelCurso.map((materiaNombre) => {
    // Buscar si hay una calificación para esta materia
    const cursoMateriaEntry = cursoMateria.find(
      (cm) => cm.curso_nombre === cursoNombre && cm.materia_nombre === materiaNombre
    );

    if (cursoMateriaEntry && gradesMap[cursoMateriaEntry.id]) {
      // Tiene calificaciones
      return gradesMap[cursoMateriaEntry.id];
    } else {
      // Sin calificaciones - mostrar "Sin calificaciones"
      return {
        materia: materiaNombre,
        curso: cursoNombre,
        prenota1: 'Sin calificaciones',
        nota1: '',
        prenota2: 'Sin calificaciones',
        nota2: '',
        diagnostico: '',
      };
    }
  });

  // Calcular inasistencias por materia para el hijo seleccionado
  const inasistenciasPorMateria = useMemo(() => {
    if (!alumno) return {};
    const misAsistencias = asistenciasAdmin.filter((a) => a.alumnoId === alumno.id);
    const porMateria = {};
    misAsistencias.forEach((a) => {
      const cm = cursoMateria.find((c) => c.id === a.id_curso_materia);
      if (!cm) return;
      const mat = cm.materia_nombre;
      if (!porMateria[mat]) porMateria[mat] = { ausencias: 0, tardanzas: 0 };
      if (a.estado === 'Ausente') porMateria[mat].ausencias += 1;
      else if (a.estado === 'Tarde') porMateria[mat].tardanzas += 1;
    });
    return porMateria;
  }, [asistenciasAdmin, alumno, cursoMateria]);

  const handleDescargarBoletin = () => {
    if (!alumno) return;
    const html = boletinHTML({
      alumnoNombre: `${alumno.apellido}, ${alumno.nombre}`,
      dni: alumno.dni,
      cursoNombre: alumno.curso_nombre_api || cursoNombre,
      anioLectivo: new Date().getFullYear(),
      materias: calificacionesDisplay,
      inasistenciasPorMateria,
    });
    exportarBoletinPDF(html, `Boletín — ${alumno.apellido}, ${alumno.nombre}`);
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones — {hijo.nombre}</h3>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={handleDescargarBoletin}
          disabled={calificacionesDisplay.length === 0}
        >
          <i className="fas fa-file-pdf" aria-hidden="true" /> Descargar boletín PDF
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Materia</th>
              <th>Prenota 1</th>
              <th>Nota 1</th>
              <th>Prenota 2</th>
              <th>Nota 2</th>
              <th>Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {calificacionesDisplay.map((c, idx) => (
              <tr key={idx}>
                <td className="table-cell-strong">{c.materia}</td>
                <td>
                  {c.prenota1 === 'Sin calificaciones' ? (
                    <span style={{ color: '#999' }}>{c.prenota1}</span>
                  ) : (
                    <span className="badge badge-cualitativa">{c.prenota1}</span>
                  )}
                </td>
                <td>{c.nota1 !== '' ? c.nota1 : '—'}</td>
                <td>
                  {c.prenota2 === 'Sin calificaciones' ? (
                    <span style={{ color: '#999' }}>{c.prenota2}</span>
                  ) : (
                    <span className="badge badge-cualitativa">{c.prenota2}</span>
                  )}
                </td>
                <td>{c.nota2 !== '' ? c.nota2 : '—'}</td>
                <td>{c.diagnostico || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Calificaciones;
