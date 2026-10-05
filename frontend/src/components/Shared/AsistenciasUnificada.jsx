import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getAsistenciasEstudianteDetalle } from '../../services/api';
import { hoy as hoyLocal } from '../../utils/fechas';
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
  const [resumenPorMateria, setResumenPorMateria] = useState([]);
  const [estadoHoy, setEstadoHoy] = useState('Pendiente');
  const [estadosHoy, setEstadosHoy] = useState([]);

  // Materias del curso del alumno. Antes la lista se armaba acá con
  // `cm.id_curso === idCurso`: si los tipos no coincidían (p. ej. "3" vs 3) el
  // filtro no dejaba pasar nada y la pantalla terminaba mostrando
  // "No hay asistencias registradas" aunque el alumno tuviera la carga hecha.
  // Se compara por String para que sea inmune al tipo.
  //
  // El `id` de cada fila es el `id_curso_materia` (NO el `id_materia`): el action
  // `alumno-detalle` filtra por `Asistencia.id_curso_materia`, así que con el id de
  // materia la consulta no encontraba nada y "Detalle por materia" salía vacío.
  const materias = useMemo(() => {
    const mapa = new Map();
    (Array.isArray(cursoMateria) ? cursoMateria : []).forEach((cm) => {
      if (idCurso != null && cm.id_curso != null && String(cm.id_curso) !== String(idCurso)) return;
      if (cm.id == null) return;
      if (!mapa.has(String(cm.id))) {
        mapa.set(String(cm.id), { id: cm.id, nombre: cm.materia_nombre || 'Sin nombre' });
      }
    });
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [cursoMateria, idCurso]);

  // Ref para leer la lista de materias desde `cargarResumen` sin ponerla en sus
  // dependencias: si fuera dependencia, cada fetch cambiaría `materias` y
  // dispararía otro fetch (bucle infinito de requests).
  const materiasRef = useRef(materias);
  useEffect(() => { materiasRef.current = materias; }, [materias]);

  const cargarResumen = useCallback(async () => {
    if (!alumnoId) return;
    try {
      const data = await getAsistenciasEstudianteDetalle('', alumnoId);
      const todas = Array.isArray(data) ? data : data.results || [];

      // Fecha local, no UTC. Con `toISOString()` en Argentina (UTC-3) después de
      // las 21:00 la fecha caía en el día siguiente y el estado de "Hoy" se
      // calculaba sobre un día que todavía no había empezado.
      const hoy = hoyLocal();
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

      // Resumen por materia: últimas asistencias de cada materia.
      const mapa = {};
      const cmPorMateria = {};
      // `todas` viene ordenado -fecha, -hora: el primer registro de cada materia es
      // el más reciente, así que el primer `id_curso_materia` que aparece es el que
      // se usa para consultar el detalle (después se sobreescribía con el más viejo).
      todas.forEach((r) => {
        const nombre = r.materia_nombre || 'General';
        if (r.id_curso_materia != null && cmPorMateria[nombre] == null) cmPorMateria[nombre] = r.id_curso_materia;
        if (!mapa[nombre]) {
          mapa[nombre] = { presente: 0, ausente: 0, tarde: 0, ultimaFecha: '', ultimoEstado: 'Sin registros' };
        }
        const est = r.estado_nombre;
        if (est === 'Presente') mapa[nombre].presente++;
        else if (est === 'Ausente') mapa[nombre].ausente++;
        else if (est === 'Tarde' || est === 'Retirado') mapa[nombre].tarde++;
        if (!mapa[nombre].ultimaFecha) {
          mapa[nombre].ultimaFecha = r.fecha || '';
          mapa[nombre].ultimoEstado = est;
        }
      });

      // Se listan las materias del curso y, además, cualquier materia que
      // aparezca en los registros aunque no esté en `cursoMateria` (por ejemplo
      // si el listado de materias del curso todavía no cargó). Así la tabla
      // nunca queda vacía teniendo asistencias reales.
      const filas = new Map();
      materiasRef.current.forEach((m) => {
        filas.set(m.nombre, {
          nombre: m.nombre,
          id: m.id,
          ...(mapa[m.nombre] || { presente: 0, ausente: 0, tarde: 0, ultimaFecha: '', ultimoEstado: 'Sin registros' }),
        });
      });
      Object.keys(mapa).forEach((nombre) => {
        if (filas.has(nombre)) return;
        // Sin `id_curso_materia` no hay forma de consultar el detalle, así que la
        // fila se lista pero sin id en vez de mandar un valor inválido como filtro.
        filas.set(nombre, { nombre, id: cmPorMateria[nombre] ?? '', ...mapa[nombre] });
      });
      setResumenPorMateria(
        [...filas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
    } catch {
      setEstadoHoy('Pendiente');
      setEstadosHoy([]);
      setResumenReciente({ presente: 0, ausente: 0, tarde: 0, pendiente: 0 });
      setResumenPorMateria([]);
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
      const data = await getAsistenciasEstudianteDetalle(cmId, alumnoId);
      setAsistencias(Array.isArray(data) ? data : (data?.results || []));
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
          <h4><i className="fas fa-layer-group icon-muted" aria-hidden="true" /> Últimas asistencias por materia</h4>
        </div>

        {resumenPorMateria.length === 0 ? (
          <p className="empty-state-message">No hay asistencias registradas para este estudiante.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Materia</th>
                  <th className="text-center">Presentes</th>
                  <th className="text-center">Ausencias</th>
                  <th className="text-center">Tardanzas</th>
                  <th>Última</th>
                </tr>
              </thead>
              <tbody>
                {resumenPorMateria.map((m) => (
                  <tr
                    key={m.nombre}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setMateriaId(String(m.id))}
                    title={`Ver detalle de ${m.nombre}`}
                  >
                    <td>{m.nombre}</td>
                    <td className="text-center">
                      <span className="badge badge-presente">{m.presente}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-ausente">{m.ausente}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-tarde">{m.tarde}</span>
                    </td>
                    <td>
                      {m.ultimoEstado === 'Sin registros' ? (
                        'Sin registros'
                      ) : (
                        <>
                          {formatearFecha(m.ultimaFecha)}{' '}
                          <span className={`badge ${ESTADO_BADGES[m.ultimoEstado] || 'badge-pendiente'}`}>
                            {ESTADO_LABELS[m.ultimoEstado] || m.ultimoEstado}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt-16">
        <div className="card-header-flex">
          <h4><i className="fas fa-layer-group icon-muted" aria-hidden="true" /> Detalle por materia</h4>
        </div>

        <div className="form-group-filter" style={{ marginBottom: '24px' }}>
          <label htmlFor="materia-asist-unificada">Materia</label>
          <select
            id="materia-asist-unificada"
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
          >
            <option value="">Seleccione una materia...</option>
            {/* Se usan las mismas filas de la tabla de arriba (que ya es la
                unión de materias del curso y de las que aparecen en los
                registros) para que toda fila tenga su opción y viceversa. */}
            {resumenPorMateria.map((m) => (
              <option key={m.nombre} value={m.id}>{m.nombre}</option>
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