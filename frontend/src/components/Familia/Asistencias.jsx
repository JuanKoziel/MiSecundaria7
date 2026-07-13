import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import AsistenciaMateriaDetalle from '../Shared/AsistenciaMateriaDetalle';

function Asistencias({ hijo }) {
  const { alumnos, cursoMateria } = useData();

  const alumno = useMemo(
    () => alumnos.find((a) => a.id === hijo.alumnoId) || null,
    [alumnos, hijo.alumnoId],
  );

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Historial de Asistencias — {hijo.nombre}</h3>
      </div>

      <div className="card mt-16">
        <div className="card-header-flex">
          <h3>Historial</h3>
        </div>

        {alumno ? (
          <AsistenciaMateriaDetalle
            alumnoId={alumno.id}
            cursoMateria={cursoMateria}
            idCurso={alumno.id_curso}
          />
        ) : (
          <p className="empty-state-message">No se pudo obtener la información del alumno.</p>
        )}
      </div>
    </div>
  );
}

export default Asistencias;
