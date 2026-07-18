import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { updateCurso } from '../../services/api';

function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.entries(data)
      .map(([campo, valor]) => `${campo}: ${Array.isArray(valor) ? valor.join(', ') : valor}`)
      .join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function AsignacionCursos() {
  const { cursosObj, preceptores, refreshData } = useData();
  const [selectedPreceptorId, setSelectedPreceptorId] = useState('');
  const [searchAsignados, setSearchAsignados] = useState('');
  const [searchDisponibles, setSearchDisponibles] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);

  const preceptoresOrdenados = useMemo(
    () => [...(preceptores || [])].sort((a, b) => (a.apellido || '').localeCompare(b.apellido || '')),
    [preceptores],
  );

  const preceptorObj = useMemo(
    () => preceptores.find((p) => String(p.id) === String(selectedPreceptorId)),
    [preceptores, selectedPreceptorId],
  );

  const cursosAsignadosIds = useMemo(() => {
    if (!preceptorObj) return new Set();
    return new Set((preceptorObj.cursos || []).map((c) => c.id_curso));
  }, [preceptorObj]);

  const cursosAsignados = useMemo(() => {
    const ids = cursosAsignadosIds;
    let arr = (cursosObj || []).filter((c) => ids.has(c.id_curso));
    if (searchAsignados) {
      const q = normalize(searchAsignados);
      arr = arr.filter(
        (c) => normalize(c.nombre_curso).includes(q) || String(c.ciclo_anio || '').includes(q),
      );
    }
    return arr.sort((a, b) => {
      const cicloA = a.ciclo_anio || 0;
      const cicloB = b.ciclo_anio || 0;
      if (cicloA !== cicloB) return cicloB - cicloA;
      return String(a.nombre_curso).localeCompare(String(b.nombre_curso));
    });
  }, [cursosObj, cursosAsignadosIds, searchAsignados]);

  const cursosDisponibles = useMemo(() => {
    let arr = (cursosObj || []).filter((c) => !cursosAsignadosIds.has(c.id_curso));
    if (searchDisponibles) {
      const q = normalize(searchDisponibles);
      arr = arr.filter(
        (c) => normalize(c.nombre_curso).includes(q) || String(c.ciclo_anio || '').includes(q),
      );
    }
    return arr.sort((a, b) => {
      const cicloA = a.ciclo_anio || 0;
      const cicloB = b.ciclo_anio || 0;
      if (cicloA !== cicloB) return cicloB - cicloA;
      return String(a.nombre_curso).localeCompare(String(b.nombre_curso));
    });
  }, [cursosObj, cursosAsignadosIds, searchDisponibles]);

  const preceptorDeCurso = (cursoId) => {
    return preceptores.find((p) =>
      (p.cursos || []).some((c) => c.id_curso === cursoId),
    );
  };

  const handleAsignar = async (cursoId) => {
    setError('');
    setSuccess('');
    setGuardando(true);
    try {
      await updateCurso(cursoId, { id_preceptor: selectedPreceptorId });
      setSuccess('Curso asignado correctamente');
      await refreshData();
    } catch (err) {
      setError(`Error al asignar curso: ${mensajeError(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleQuitar = async (cursoId) => {
    if (!window.confirm('¿Quitar este curso del preceptor?')) return;
    setError('');
    setSuccess('');
    setGuardando(true);
    try {
      await updateCurso(cursoId, { id_preceptor: null });
      setSuccess('Curso removido correctamente');
      await refreshData();
    } catch (err) {
      setError(`Error al quitar curso: ${mensajeError(err)}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Asignación de Cursos a Preceptores</h3>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {selectedPreceptorId && preceptorObj ? (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header-flex card-header-flex--compact">
                <h4>
                  <i className="fas fa-user-tie icon-muted" aria-hidden="true" />
                  {' '}{preceptorObj.apellido}, {preceptorObj.nombre}
                </h4>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSelectedPreceptorId('')}
                  title="Volver a la lista"
                >
                  <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
                </button>
              </div>

              <div className="mb-12">
                <div className="empty-state-message flex-gap-16--wrap">
                  <span>
                    <strong>Cursos asignados:</strong> {cursosAsignados.length}
                  </span>
                </div>
              </div>

              <div className="mb-12">
                <input
                  type="text"
                  placeholder="Buscar cursos asignados..."
                  value={searchAsignados}
                  onChange={(e) => setSearchAsignados(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Curso</th>
                      <th>Año</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursosAsignados.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty-state-message">
                          {searchAsignados ? 'No se encontraron cursos.' : 'No tiene cursos asignados.'}
                        </td>
                      </tr>
                    ) : (
                      cursosAsignados.map((curso) => (
                        <tr key={curso.id_curso}>
                          <td className="table-cell-strong">{curso.nombre_curso}</td>
                          <td>{curso.ciclo_anio || '---'}</td>
                          <td className="acciones-cell">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleQuitar(curso.id_curso)}
                              disabled={guardando}
                              title="Quitar curso"
                            >
                              <i className="fas fa-times" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header-flex card-header-flex--compact">
                <h4>Cursos disponibles</h4>
                <span className="badge badge-neutral">{cursosDisponibles.length}</span>
              </div>

              <div className="mb-12">
                <input
                  type="text"
                  placeholder="Buscar cursos disponibles..."
                  value={searchDisponibles}
                  onChange={(e) => setSearchDisponibles(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Curso</th>
                      <th>Año</th>
                      <th>Preceptor actual</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursosDisponibles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-state-message">
                          {searchDisponibles ? 'No se encontraron cursos.' : 'No hay cursos disponibles.'}
                        </td>
                      </tr>
                    ) : (
                      cursosDisponibles.map((curso) => {
                        const preceptorActual = preceptorDeCurso(curso.id_curso);
                        return (
                          <tr key={curso.id_curso}>
                            <td className="table-cell-strong">{curso.nombre_curso}</td>
                            <td>{curso.ciclo_anio || '---'}</td>
                            <td>
                              {preceptorActual
                                ? `${preceptorActual.apellido}, ${preceptorActual.nombre}`
                                : <span style={{ color: '#999' }}>Sin asignar</span>}
                            </td>
                            <td className="acciones-cell">
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() => handleAsignar(curso.id_curso)}
                                disabled={guardando}
                                title="Asignar a este preceptor"
                              >
                                <i className="fas fa-plus" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-12">
            <div className="empty-state-message flex-gap-16--wrap mb-12">
              <span><i className="fas fa-mouse-pointer" aria-hidden="true" /> Seleccioná un preceptor para ver y administrar sus cursos</span>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Preceptor</th>
                  <th>Cursos Asignados</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {preceptoresOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state-message">
                      No hay preceptores registrados.
                    </td>
                  </tr>
                ) : (
                  preceptoresOrdenados.map((p) => (
                    <tr key={p.id_preceptor}>
                      <td className="table-cell-strong">
                        <i className="fas fa-user-tie icon-muted" aria-hidden="true" />
                        {' '}{p.apellido}, {p.nombre}
                      </td>
                      <td>
                        {(p.cursos || []).length > 0
                          ? (p.cursos || []).map((c) => c.nombre_curso).join(', ')
                          : <span style={{ color: '#999' }}>Sin cursos</span>}
                      </td>
                      <td className="acciones-cell">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setSelectedPreceptorId(p.id)}
                          title="Administrar cursos"
                        >
                          <i className="fas fa-edit" aria-hidden="true" /> Administrar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AsignacionCursos;
