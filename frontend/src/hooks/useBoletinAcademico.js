import { useEffect, useState } from 'react';
import { getBoletinAcademico } from '../services/api';

// Obtiene las secciones adicionales del boletin desde
// /api/boletin-academico/<alumnoId>/.
// Claves devueltas por el endpoint:
//   - intensificaciones_1c: { [materia_nombre]: nota }  (intensificacion 1er cuatrimestre)
//   - bloqueos_por_materia: { [materia_nombre]: { bloqueada, motivo } }
//   - intensificaciones_posteriores: [{ materia, anio, diciembre, febrero }]
//   - recursadas: [{ materia, anio, estado }]
//   - previas: [{ materia, anio, periodo, calificacion }]
export function useBoletinAcademico(alumnoId) {
  const [intensificaciones_1c, setIntensificaciones1c] = useState({});
  const [bloqueos_por_materia, setBloqueos] = useState({});
  const [intensificaciones_posteriores, setPosteriores] = useState([]);
  const [recursadas, setRecursadas] = useState([]);
  const [previas, setPrevias] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alumnoId) {
      setIntensificaciones1c({});
      setBloqueos({});
      setPosteriores([]);
      setRecursadas([]);
      setPrevias([]);
      return undefined;
    }
    let cancel = false;
    setLoading(true);
    getBoletinAcademico(alumnoId)
      .then((res) => {
        if (cancel) return;
        const d = res.data || {};
        setIntensificaciones1c(d.intensificaciones_1c || {});
        setBloqueos(d.bloqueos_por_materia || {});
        setPosteriores(d.intensificaciones_posteriores || []);
        setRecursadas(d.recursadas || []);
        setPrevias(d.previas || []);
      })
      .catch(() => {
        if (cancel) return;
        setIntensificaciones1c({});
        setBloqueos({});
        setPosteriores([]);
        setRecursadas([]);
        setPrevias([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [alumnoId]);

  return {
    intensificaciones_1c,
    bloqueos_por_materia,
    intensificaciones_posteriores,
    recursadas,
    previas,
    loading,
  };
}
