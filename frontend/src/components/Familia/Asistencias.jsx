import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import AsistenciasUnificada from '../Shared/AsistenciasUnificada';

function Asistencias({ hijo }) {
  const { alumnos, cursoMateria } = useData();

  const alumno = useMemo(
    () => alumnos.find((a) => a.id === hijo.alumnoId) || null,
    [alumnos, hijo.alumnoId],
  );

  return (
    <div className="card">
      {alumno ? (
        <AsistenciasUnificada
          alumnoId={alumno.id}
          cursoMateria={cursoMateria}
          idCurso={alumno.id_curso}
        />
      ) : (
        <>
          <div className="card-header-flex">
            <h3>Historial de Asistencias — {hijo.nombre}</h3>
          </div>
          <p className="empty-state-message">No se pudo obtener la información del estudiante.</p>
        </>
      )}
    </div>
  );
}

export default Asistencias;
