import { useData } from '../../context/DataContext';

function Calificaciones({ hijo }) {
  const { calificacionesFamilia, materiasPorCurso, cursoMateria, periodos } = useData();
  
  // Get all subjects for the child's course
  const cursoNombre = hijo.curso;
  const materiasDelCurso = materiasPorCurso[cursoNombre] || [];
  
  // Filter grades for this child by alumnoId (not hijoId)
  const calificacionesHijo = calificacionesFamilia.filter((c) => c.alumnoId === hijo.alumnoId);
  
  // Build a map of existing grades by curso_materia ID
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
    // Since calificacionesFamilia already has grouped grades, just use them directly
    gradesMap[key].prenota1 = c.prenota1 || '';
    gradesMap[key].nota1 = c.nota1 ?? '';
    gradesMap[key].prenota2 = c.prenota2 || '';
    gradesMap[key].nota2 = c.nota2 ?? '';
    gradesMap[key].diagnostico = c.diagnostico || '';
  });
  
  // Build the final list from all course subjects
  const calificacionesDisplay = materiasDelCurso.map((materiaNombre) => {
    // Find if there's a grade for this subject
    const cursoMateriaEntry = cursoMateria.find(
      (cm) => cm.curso_nombre === cursoNombre && cm.materia_nombre === materiaNombre
    );
    
    if (cursoMateriaEntry && gradesMap[cursoMateriaEntry.id]) {
      // Has grades
      return gradesMap[cursoMateriaEntry.id];
    } else {
      // No grades - show "Sin calificaciones"
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

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calificaciones — {hijo.nombre}</h3>
        <span className="badge role-badge-display">Solo lectura</span>
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
