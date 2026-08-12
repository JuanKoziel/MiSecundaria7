import { useEffect, useState } from 'react';
import { getBoletinAcademico } from '../services/api';

// Obtiene las secciones adicionales del boletin (intensificaciones, bloqueos y
// situaciones) desde el endpoint /api/boletin-academico/<alumnoId>/.
// Mantiene la logica local de calificaciones intacta: solo aporta estas secciones.
export function useBoletinAcademico(alumnoId) {
  const [intensificaciones, setIntensificaciones] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [situaciones, setSituaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alumnoId) {
      setIntensificaciones([]);
      setBloqueos([]);
      setSituaciones([]);
      return undefined;
    }
    let cancel = false;
    setLoading(true);
    getBoletinAcademico(alumnoId)
      .then((res) => {
        if (cancel) return;
        const d = res.data || {};
        setIntensificaciones(d.intensificaciones || []);
        setBloqueos(d.bloqueos || []);
        setSituaciones(d.situaciones || []);
      })
      .catch(() => {
        if (cancel) return;
        setIntensificaciones([]);
        setBloqueos([]);
        setSituaciones([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [alumnoId]);

  return { intensificaciones, bloqueos, situaciones, loading };
}
