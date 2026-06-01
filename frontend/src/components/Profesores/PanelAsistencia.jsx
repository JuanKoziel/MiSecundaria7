import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { createAsistencia } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MODULOS, diaSemanaNombre, moduloActual } from '../../utils/modulos';

const ESTADOS = ['Presente', 'Ausente', 'Tarde'];

function diaDeFecha(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-').map(Number);
  return diaSemanaNombre(new Date(y, (m || 1) - 1, d || 1));
}

function PanelAsistencia({ cursoMateriaId, cursoId, cursoNombre }) {
  const { alumnos, estadosAsistencia, horarios, refreshData } = useData();
  const { user } = useAuth();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [numModulo, setNumModulo] = useState(() => String(moduloActual() || ''));
  const [filas, setFilas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const alumnosCurso = useMemo(
    () => alumnos.filter((a) => a.id_curso === cursoId),
    [alumnos, cursoId],
  );

  const diaSel = diaDeFecha(fecha);
  const horariosMateria = useMemo(
    () => horarios.filter((h) => h.id_curso_materia === cursoMateriaId),
    [horarios, cursoMateriaId],
  );
  const horarioValido = useMemo(
    () =>
      horariosMateria.find(
        (h) => h.dia_semana === diaSel && h.numero_modulo === Number(numModulo),
      ) || null,
    [horariosMateria, diaSel, numModulo],
  );
  // Módulos en los que esta materia tiene clase el día seleccionado.
  const modulosDelDia = useMemo(
    () => horariosMateria.filter((h) => h.dia_semana === diaSel).map((h) => h.numero_modulo),
    [horariosMateria, diaSel],
  );

  useEffect(() => {
    setFilas(
      alumnosCurso.map((a) => ({
        id: a.id,
        nombre: `${a.apellido}, ${a.nombre}`,
        estado: 'Presente',
      })),
    );
  }, [alumnosCurso]);

  const handleEstadoChange = (id, nuevoEstado) => {
    setFilas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: nuevoEstado } : a)),
    );
  };

  const handleGuardar = async () => {
    if (!horarioValido) {
      setMensaje('Esta materia no posee clases programadas para este día y horario.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      const estadoMap = {};
      estadosAsistencia.forEach((e) => {
        estadoMap[e.nombre_estado] = e.id_estado_asistencia;
      });
      const promises = filas.map((a) =>
        createAsistencia({
          id_alumno: a.id,
          id_curso_materia: cursoMateriaId,
          fecha,
          numero_modulo: Number(numModulo),
          id_estado_asistencia: estadoMap[a.estado] || estadosAsistencia[0]?.id_estado_asistencia || 1,
          id_usuario: user?.id || 1,
        }),
      );
      await Promise.all(promises);
      setMensaje('Asistencia guardada exitosamente.');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planilla de Asistencia — {cursoNombre}</h3>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGuardar}
          disabled={guardando || !horarioValido}
        >
          <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar Asistencia'}
        </button>
      </div>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      <div className="filter-row">
        <div className="form-group-filter">
          <label htmlFor="fecha-asistencia">Fecha</label>
          <input
            id="fecha-asistencia"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="form-group-filter">
          <label htmlFor="modulo-asistencia">Módulo</label>
          <select
            id="modulo-asistencia"
            value={numModulo}
            onChange={(e) => setNumModulo(e.target.value)}
          >
            <option value="">Seleccione módulo...</option>
            {MODULOS.map((m) => (
              <option key={m.numero} value={m.numero}>
                {m.label}
                {modulosDelDia.includes(m.numero) ? ' • clase' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group-filter filtro-orientacion">
          <span className="badge">Día: {diaSel || '—'}</span>
        </div>
      </div>

      {numModulo && !horarioValido && (
        <p className="asist-info-banner asist-bloqueado">
          <i className="fas fa-ban" aria-hidden="true" /> Esta materia no posee clases
          programadas para este día y horario.
        </p>
      )}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-state-message">
                  No hay alumnos en este curso.
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id}>
                  <td className="table-cell-strong">{fila.nombre}</td>
                  <td>
                    <select
                      value={fila.estado}
                      onChange={(e) => handleEstadoChange(fila.id, e.target.value)}
                      className="select-table"
                    >
                      {ESTADOS.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PanelAsistencia;
