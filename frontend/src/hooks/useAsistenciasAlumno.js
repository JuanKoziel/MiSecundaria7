import { useEffect, useMemo, useState } from 'react';
import { getAsistenciasEstudianteDetalle } from '../services/api';

// Resumen de asistencias de un alumno para las tarjetas de inicio y el RITE.
//
// No se puede leer del contexto global: `asistenciasRaw` en DataContext está
// pineado a `[]` a propósito (es la tabla completa, sin paginar, y ningún
// panel la baja entera). Por eso las tarjetas de Alumno y de Familia > Resumen
// daban 0/0/0/0 aunque el docente hubiera cargado. Acá se usa el endpoint
// acotado por alumno, que es el mismo que usa la tabla de Asistencias.
export function useAsistenciasAlumno(alumnoId) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alumnoId) {
      setRegistros([]);
      return undefined;
    }
    let cancel = false;
    setLoading(true);
    getAsistenciasEstudianteDetalle('', alumnoId)
      .then((data) => {
        if (cancel) return;
        setRegistros(Array.isArray(data) ? data : data?.results || []);
      })
      .catch(() => {
        if (cancel) return;
        setRegistros([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => { cancel = true; };
  }, [alumnoId]);

  const resumen = useMemo(() => {
    const cuenta = { presente: 0, ausente: 0, tarde: 0, pendiente: 0 };
    const porMateria = {};
    registros.forEach((r) => {
      const est = r.estado_nombre;
      if (est === 'Presente') cuenta.presente++;
      else if (est === 'Ausente') cuenta.ausente++;
      else if (est === 'Tarde' || est === 'Retirado') cuenta.tarde++;
      else cuenta.pendiente++;

      const materia = r.materia_nombre || 'General';
      if (!porMateria[materia]) porMateria[materia] = { ausencias: 0, tardanzas: 0 };
      if (est === 'Ausente') porMateria[materia].ausencias += 1;
      else if (est === 'Tarde' || est === 'Retirado') porMateria[materia].tardanzas += 1;
    });
    return {
      ...cuenta,
      total: cuenta.presente + cuenta.ausente + cuenta.tarde,
      inasistencias: cuenta.ausente + cuenta.tarde,
      inasistenciasPorMateria: porMateria,
      registros,
    };
  }, [registros]);

  return { ...resumen, loading };
}

export default useAsistenciasAlumno;
