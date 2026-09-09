import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { getAsistenciasAlumnoDetalle } from '../../services/api';
import LoadingSpinner from './LoadingSpinner';

const ESTADO_LABELS = {
  Presente: 'Presente',
  Ausente: 'Ausente',
  Tarde: 'Tarde',
  Retirado: 'Retirado',
  'Sin registro': 'Sin registro',
};

const ESTADO_BADGES = {
  Presente: 'badge-presente',
  Ausente: 'badge-ausente',
  Tarde: 'badge-tarde',
  Retirado: 'badge-tarde',
  Pendiente: 'badge-pendiente',
};

function formatearFecha(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function formatearFechaCorta(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

function esHoy(isoStr) {
  if (!isoStr) return false;
  const hoy = new Date();
  const [y, m, d] = isoStr.split('-').map(Number);
  return hoy.getFullYear() === y && hoy.getMonth() + 1 === m && hoy.getDate() === d;
}

// Lógica de combinación de estados (misma que backend, en orden cronológico):
//   Faltó + Faltó      -> Ausente
//   Presente + Presente -> Presente
//   Faltó + Presente   -> Tarde
//   Presente + Faltó   -> Retirado
// Se comparan solo el primer y segundo registro en orden de hora.
function combinarEstados(estados) {
  if (!estados || estados.length === 0) return 'Sin registro';
  if (estados.length === 1) return estados[0];

  const par = estados.slice(0, 2);

  if (par[0] === 'Ausente' && par[1] === 'Ausente') return 'Ausente';
  if (par[0] === 'Presente' && par[1] === 'Presente') return 'Presente';
  if (par[0] === 'Ausente' && par[1] === 'Presente') return 'Tarde';
  if (par[0] === 'Presente' && par[1] === 'Ausente') return 'Retirado';

  // Fallback
  return estados[0];
}

export default function AsistenciasUnificada({ alumnoId, cursoMateria, idCurso, userRole }) {
  const [materiaId, setMateriaId] = useState('');
  const [asistencias, setAsistencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [resumenReciente, setResumenReciente] = useState({ presente: 0, ausente: 0, tarde: 0, pendiente: 0 });
  const [estadoHoy, setEstadoHoy] = useState('Pendiente');
  const [estadosHoy, setEstadosHoy] = useState([]);

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

  const cargarResumen = useCallback(async () => {
    if (!alumnoId) return;
    try {
      const data = await getAsistenciasAlumnoDetalle('', alumnoId);
      const todas = Array.isArray(data) ? data : data.results || [];

      const hoy = new Date().toISOString().split('T')[0];
      // Orden cronológico: el backend devuelve por -fecha, -hora, por eso se
      // reordena ascendente por hora antes de combinar.
      const estadosHoy = todas
        .filter(r => r.fecha === hoy && r.estado_nombre)
        .sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'))
        .map(r => r.estado_nombre);
      
      // Calcular estado combinado para hoy (misma lógica que backend)
      const estadoCombinado = combinarEstados(estadosHoy);
      setEstadoHoy(estadoCombinado);
      setEstadosHoy(estadosHoy);

      const ultimas = [...todas].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 7);
      const resumen = ultimas.reduce((acc, r) => {
        const est = r.estado_nombre;
        if (est === 'Presente') acc.presente++;
        else if (est === 'Ausente') acc.ausente++;
        else if (est === 'Tarde') acc.tarde++;
        else if (est === 'Retirado') acc.tarde++;
        else acc.pendiente++;
        return acc;
      }, { presente: 0, ausente: 0, tarde: 0, pendiente: 0 });
      setResumenReciente(resumen);
    } catch {
      setEstadoHoy('Pendiente');
      setEstadosHoy([]);
      setResumenReciente({ presente: 0, ausente: 0, tarde: 0, pendiente: 0 });
    }
  }, [alumnoId]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

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

  return (
    <div>
      <div className="card-header-flex">
        <h3><i className="fas fa-calendar-check" aria-hidden="true" /> Asistencias</h3>
        {userRole !== 'alumno' && <span className="badge role-badge-display">Solo lectura</span>}
      </div>

      <div className="card mt-16">
        <div className="card-header-flex">
          <h4><i className="fas fa-chart-line icon-muted" aria-hidden="true" /> Resumen reciente (últimos 7 días)</h4>
          <div className="flex-row">
            <span className={`badge ${ESTADO_BADGES[estadoHoy] || 'badge-pendiente'}`}>
              <i className={`fas ${
                estadoHoy === 'Presente' ? 'fa-check-circle' :
                estadoHoy === 'Ausente' ? 'fa-times-circle' :
                estadoHoy === 'Tarde' ? 'fa-clock' :
                estadoHoy === 'Retirado' ? 'fa-sign-out-alt' : 'fa-clock'
              }`} aria-hidden="true" />
              Hoy: {estadoHoy}
              {estadosHoy.length > 1 && (
                <span className="badge badge-pendiente" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>
                  ({estadosHoy.join(', ')})
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex-gap-16--wrap mb-16">
          <div className="asistencia-badge presentes">
            <strong>{resumenReciente.presente}</strong> Presentes
          </div>
          <div className="asistencia-badge ausencias">
            <strong>{resumenReciente.ausente}</strong> Ausentes
          </div>
          <div className="asistencia-badge tardanzas">
            <strong>{resumenReciente.tarde}</strong> Tardes
          </div>
          <div className="asistencia-badge" style={{ background: '#fff3cd' }}>
            <strong>{resumenReciente.pendiente}</strong> Pendientes
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="card-header-flex">
          <h4><i className="fas fa-layer-group icon-muted" aria-hidden="true" /> Detalle por materia</h4>
        </div>

        <div className="form-group-filter mb-16">
          <label htmlFor="materia-asist-unificada">Materia</label>
          <select
            id="materia-asist-unificada"
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
          >
            <option value="">Seleccione una materia...</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        {!materiaId ? null : cargando ? (
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
                    <td>{formatearFecha(r.fecha)} {esHoy(r.fecha) && <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>Hoy</span>}</td>
                    <td>{r.horario || '-'}</td>
                    <td>{r.docente_nombre}</td>
                    <td>
                      <span className={`badge ${ESTADO_BADGES[r.estado_nombre] || 'badge-pendiente'}`}>
                        {ESTADO_LABELS[r.estado_nombre] || r.estado_nombre || 'Pendiente'}
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
    </div>
  );
}