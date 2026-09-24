import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import AsistenciasUnificada from '../Shared/AsistenciasUnificada';

function Asistencias({ hijo }) {
  const { estudiantes, cursoMateria } = useData();

  const estudiante = useMemo(
    () => estudiantes.find((a) => a.id === hijo.alumnoId) || null,
    [estudiantes, hijo.alumnoId],
  );

  return (
    <div className="card">
      {estudiante ? (
        <AsistenciasUnificada
          alumnoId={estudiante.id}
          cursoMateria={cursoMateria}
          idCurso={estudiante.id_curso}
          userRole="familia"
        />
      ) : (
        <>
          <div className="card-header-flex">
            <h3><i className="fas fa-user-check" aria-hidden="true" /> Historial de Asistencias — {hijo.nombre}</h3>
          </div>
          <p className="empty-state-message">No se pudo obtener la información del estudiante.</p>
        </>
      )}
    </div>
  );
}

export default Asistencias;
