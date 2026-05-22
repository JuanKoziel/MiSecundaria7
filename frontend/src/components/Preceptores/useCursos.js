import { useEffect, useState } from 'react';
import { fetchCatalogos } from '../../api/services';

export function useCursos() {
  const [cursos, setCursos] = useState([]);
  const [curso, setCurso] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalogos()
      .then((data) => {
        const lista = data.cursos || [];
        setCursos(lista);
        if (lista.length > 0) setCurso(lista[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { cursos, curso, setCurso, error, loading };
}
