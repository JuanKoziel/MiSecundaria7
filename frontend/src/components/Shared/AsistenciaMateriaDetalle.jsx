import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAsistenciasAlumnoDetalle } from '../../services/api';
import LoadingSpinner from './LoadingSpinner';

export default function AsistenciaMateriaDetalle({ alumnoId, cursoMateria, idCurso }) {
  const [materiaId, setMateriaId] = useState('');
  const [asistencias, setAsistencias] = useState([]);
  const [cargando, setCargando] = useState(false);

  const materias = useMemo(() => {
    const map = new Map();
    (cursoMateria || [])
      .filter((cm) => cm.id_curso === idCurso)
      .forEach((cm) => {
        if (!map.has(cm.id)) {
          map.set(cm.id, { id: cm.id, nombre: cm.materia_nombre || 'Sin nombre' });
        }
      });
    return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [cursoMateria, idCurso]);

  useEffect(() => {
    setMateriaId('');
    setAsistencias([]);
  }, [alumnoId]);

  const cargar = useCallback(async (cmId) => {
    if (!cmId) { setAsistencias([]); return; }
    setCargando(true);
    try {
      const data = await getAsistenciasAlumnoDetalle(cmId, alumnoId);
      setAsistencias(data);
    } catch {
      setAsistencias([]);
    } finally {
      setCargando(false);
    }
  }, [alumnoId]);

  useEffect(() => {
    if (materiaId) cargar(materiaId);
  }, [materiaId, cargar]);

  function formatearFecha(isoStr) {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  return (
    <div>
      <div className="form-group-filter mb-16">
        <label htmlFor="materia-asist-detalle">Materia</label>
        <select
          id="materia-asist-detalle"
          value={materiaId}
          onChange={(e) => setMateriaId(e.target.value)}
        >
          <option value="">Seleccione una materia...</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>

      {!materiaId ? (
        <p className="empty-state-message">Seleccione una materia para ver sus asistencias.</p>
      ) : cargando ? (
        <LoadingSpinner text="Cargando asistencias..." size="sm" inline />
      ) : asistencias.length === 0 ? (
        <p className="empty-state-message">No hay asistencias registradas para esta materia.</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Docente</th>
                <th>Estado</th>
                <th>Hora de carga</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((r) => (
                <tr key={r.id}>
                  <td>{formatearFecha(r.fecha)}</td>
                  <td>{r.horario || '-'}</td>
                  <td>{r.docente_nombre}</td>
                  <td>
                    <span className={`badge ${
                      r.estado_nombre === 'Presente' ? 'badge-presente' :
                      r.estado_nombre === 'Ausente' ? 'badge-ausente' : 'badge-tarde'
                    }`}>
                      {r.estado_nombre}
                    </span>
                  </td>
                  <td>{r.hora || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
