import { useState, useEffect, useCallback } from 'react';
import FormModal from '../Shared/FormModal';
import {
  getEventosInstitucionales,
  createEventoInstitucional,
  updateEventoInstitucional,
  deleteEventoInstitucional,
} from '../../services/api';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_CAB = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const TIPO_COLORS = {
  'Feriado': '#0d6efd',
  'Suspension': '#fd7e14',
  'Jornada Institucional': '#198754',
  'Otro': '#6c757d',
};

const TIPOS = ['Feriado', 'Suspension', 'Jornada Institucional', 'Otro'];
const ALCANCE_OPCIONES = [
  { value: 'todo_dia', label: 'Todo el día' },
  { value: 'manana', label: 'Turno mañana' },
  { value: 'tarde', label: 'Turno tarde' },
  { value: 'franja', label: 'Franja horaria personalizada' },
];

const FORM_DEFAULT = {
  tipo_evento: 'Feriado',
  descripcion: '',
  fecha: '',
  permanente: false,
  alcance: 'todo_dia',
  hora_inicio: '',
  hora_fin: '',
};

function coloresUnicos(eventos) {
  const seen = new Set();
  const result = [];
  for (const ev of eventos) {
    const c = TIPO_COLORS[ev.tipo_evento] || TIPO_COLORS['Otro'];
    if (!seen.has(c)) {
      seen.add(c);
      result.push(c);
    }
  }
  return result;
}

function CalendarioInstitucional() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoEditar, setEventoEditar] = useState(null);
  const [eventoVer, setEventoVer] = useState(null);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargarEventos = useCallback(async () => {
    setCargando(true);
    try {
      const data = await getEventosInstitucionales();
      setEventos(Array.isArray(data) ? data : data.results || []);
    } catch {
      setEventos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarEventos(); }, [cargarEventos]);

  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const primerDiaMes = new Date(anio, mes, 1);
  let diaInicioSemana = primerDiaMes.getDay();
  diaInicioSemana = diaInicioSemana === 0 ? 6 : diaInicioSemana - 1;

  const eventosDelMes = eventos.filter((ev) => {
    const f = new Date(ev.fecha + 'T00:00:00');
    if (ev.permanente) return f.getMonth() === mes;
    return f.getFullYear() === anio && f.getMonth() === mes;
  });

  const eventosPorDia = {};
  for (let d = 1; d <= diasEnMes; d++) {
    eventosPorDia[d] = [];
  }
  eventosDelMes.forEach((ev) => {
    const f = new Date(ev.fecha + 'T00:00:00');
    const dia = f.getDate();
    if (eventosPorDia[dia]) eventosPorDia[dia].push(ev);
  });

  const navegarMes = (dir) => {
    let nMes = mes + dir;
    let nAnio = anio;
    if (nMes > 11) { nMes = 0; nAnio++; }
    if (nMes < 0) { nMes = 11; nAnio--; }
    setMes(nMes);
    setAnio(nAnio);
    setDiaSeleccionado(null);
    setEventoVer(null);
  };

  const navegarAnio = (dir) => {
    setAnio(anio + dir);
    setDiaSeleccionado(null);
    setEventoVer(null);
  };

  const irAHoy = () => {
    setAnio(hoy.getFullYear());
    setMes(hoy.getMonth());
    setDiaSeleccionado(null);
    setEventoVer(null);
  };

  const abrirModalNuevo = (dia) => {
    const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    setForm({ ...FORM_DEFAULT, fecha: fechaStr });
    setEventoEditar(null);
    setMensaje('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (ev) => {
    setForm({
      tipo_evento: ev.tipo_evento,
      descripcion: ev.descripcion,
      fecha: ev.fecha,
      permanente: ev.permanente,
      alcance: ev.alcance || 'todo_dia',
      hora_inicio: ev.hora_inicio || '',
      hora_fin: ev.hora_fin || '',
    });
    setEventoEditar(ev);
    setMensaje('');
    setEventoVer(null);
    setModalAbierto(true);
  };

  const handleGuardar = async () => {
    if (!form.descripcion || !form.fecha) {
      setMensaje('Error: La descripción y la fecha son obligatorias.');
      return;
    }
    if (form.alcance === 'franja' && (!form.hora_inicio || !form.hora_fin)) {
      setMensaje('Error: Para franja horaria se requiere hora inicio y fin.');
      return;
    }
    if (form.alcance === 'franja' && form.hora_inicio && form.hora_fin && form.hora_inicio >= form.hora_fin) {
      setMensaje('Error: La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      const payload = { ...form };
      if (payload.alcance !== 'franja') {
        payload.hora_inicio = null;
        payload.hora_fin = null;
      }
      if (eventoEditar) {
        await updateEventoInstitucional(eventoEditar.id_evento, payload);
      } else {
        await createEventoInstitucional(payload);
      }
      setModalAbierto(false);
      await cargarEventos();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (ev) => {
    if (!window.confirm(`¿Eliminar el evento "${ev.tipo_evento}" del ${ev.fecha}?`)) return;
    try {
      await deleteEventoInstitucional(ev.id_evento);
      setModalAbierto(false);
      setEventoVer(null);
      await cargarEventos();
    } catch (err) {
      setMensaje(`Error al eliminar: ${err.message}`);
    }
  };

  const diasCeldas = [];
  for (let i = 0; i < diaInicioSemana; i++) {
    diasCeldas.push(<div key={`empty-${i}`} className="cal-cell cal-empty" />);
  }
  for (let d = 1; d <= diasEnMes; d++) {
    const evs = eventosPorDia[d] || [];
    const isSelected = diaSeleccionado === d;
    const colores = coloresUnicos(evs);

    let cellContent = null;

    if (colores.length === 0) {
      cellContent = <span className="cal-dia-num">{d}</span>;
    } else if (colores.length === 1) {
      cellContent = <span className="cal-dia-num cal-dia-num-claro">{d}</span>;
    } else {
      cellContent = (
        <>
          <div className="cal-cell-colors">
            {colores.map((c, i) => (
              <div key={i} className="cal-cell-color-bar" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="cal-dia-num cal-dia-num-claro">{d}</span>
        </>
      );
    }

    diasCeldas.push(
      <div
        key={d}
        className={`cal-cell${isSelected ? ' cal-selected' : ''}${colores.length === 1 ? ' cal-cell-colored' : ''}`}
        style={colores.length === 1 ? { backgroundColor: colores[0] } : undefined}
        onClick={() => { setDiaSeleccionado(d); setEventoVer(null); }}
        role="button"
        tabIndex={0}
      >
        {cellContent}
      </div>,
    );
  }

  const eventosDelDiaSeleccionado = diaSeleccionado ? (eventosPorDia[diaSeleccionado] || []) : [];

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Calendario Institucional</h3>
        <button type="button" className="btn btn-primary" onClick={() => abrirModalNuevo(diaSeleccionado || 1)}>
          <i className="fas fa-plus" aria-hidden="true" /> Nuevo Evento
        </button>
      </div>

      <div className="cal-nav">
        <button type="button" className="btn btn-secondary" onClick={() => navegarAnio(-1)} title="Año anterior">
          <i className="fas fa-angle-double-left" aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navegarMes(-1)}>
          <i className="fas fa-chevron-left" aria-hidden="true" />
        </button>
        <span className="cal-nav-titulo">{MESES[mes]} {anio}</span>
        <button type="button" className="btn btn-secondary" onClick={() => navegarMes(1)}>
          <i className="fas fa-chevron-right" aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navegarAnio(1)} title="Año siguiente">
          <i className="fas fa-angle-double-right" aria-hidden="true" />
        </button>
        {anio !== hoy.getFullYear() && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={irAHoy} title="Volver a hoy">
            Hoy
          </button>
        )}
      </div>

      <div className="cal-leyenda">
        {Object.entries(TIPO_COLORS).map(([tipo, color]) => (
          <span key={tipo} className="cal-leyenda-item">
            <span className="cal-leyenda-color" style={{ backgroundColor: color }} /> {tipo}
          </span>
        ))}
      </div>

      {cargando ? (
        <p style={{ padding: '16px' }}>Cargando eventos...</p>
      ) : (
        <div className="cal-grid">
          {DIAS_CAB.map((d) => (
            <div key={d} className="cal-cab">{d}</div>
          ))}
          {diasCeldas}
        </div>
      )}

      {diaSeleccionado && !eventoVer && (
        <div className="cal-dia-panel">
          <div className="cal-dia-panel-header">
            <h4>{diaSeleccionado} de {MESES[mes]} {anio}</h4>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirModalNuevo(diaSeleccionado)}>
              <i className="fas fa-plus" aria-hidden="true" /> Agregar
            </button>
          </div>
          {eventosDelDiaSeleccionado.length === 0 ? (
            <p className="text-muted" style={{ padding: '8px 0' }}>Sin eventos para este día.</p>
          ) : (
            <div className="cal-eventos-lista">
              {eventosDelDiaSeleccionado.map((ev) => (
                <div
                  key={ev.id_evento}
                  className="cal-evento-item"
                  style={{ borderLeftColor: TIPO_COLORS[ev.tipo_evento] || TIPO_COLORS['Otro'], cursor: 'pointer' }}
                  onClick={() => setEventoVer(ev)}
                >
                  <div className="cal-evento-info">
                    <strong>{ev.tipo_evento}</strong>
                    <span className="text-muted">{ev.descripcion}</span>
                    {ev.permanente && <span className="badge" style={{ backgroundColor: '#0d6efd', color: '#fff', fontSize: '0.7em' }}>Permanente</span>}
                    <span className="text-muted" style={{ fontSize: '0.85em' }}>
                      {ALCANCE_OPCIONES.find((a) => a.value === ev.alcance)?.label || 'Todo el día'}
                      {ev.alcance === 'franja' && ev.hora_inicio && ev.hora_fin && ` (${ev.hora_inicio?.slice(0,5)} a ${ev.hora_fin?.slice(0,5)})`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {eventoVer && (
        <div className="cal-dia-panel">
          <div className="cal-dia-panel-header">
            <h4>Detalle del Evento</h4>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEventoVer(null)}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> Volver
            </button>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <p><strong>Tipo:</strong> {eventoVer.tipo_evento}</p>
            <p><strong>Descripción:</strong> {eventoVer.descripcion}</p>
            <p><strong>Fecha:</strong> {eventoVer.fecha}{eventoVer.permanente ? ' (Permanente — todos los años)' : ''}</p>
            <p><strong>Alcance:</strong> {ALCANCE_OPCIONES.find((a) => a.value === eventoVer.alcance)?.label || 'Todo el día'}</p>
            {eventoVer.alcance === 'franja' && eventoVer.hora_inicio && eventoVer.hora_fin && (
              <p><strong>Horario:</strong> {eventoVer.hora_inicio?.slice(0,5)} a {eventoVer.hora_fin?.slice(0,5)}</p>
            )}
            {eventoVer.creado_por_nombre && (
              <p><strong>Creado por:</strong> {eventoVer.creado_por_nombre}</p>
            )}
            {eventoVer.fecha_creacion && (
              <p><strong>Fecha de creación:</strong> {eventoVer.fecha_creacion?.slice(0,16).replace('T',' ')}</p>
            )}
            {eventoVer.fecha_modificacion && (
              <p><strong>Última modificación:</strong> {eventoVer.fecha_modificacion?.slice(0,16).replace('T',' ')}</p>
            )}
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrirModalEditar(eventoVer)}>
                <i className="fas fa-edit" aria-hidden="true" /> Editar
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleEliminar(eventoVer)}>
                <i className="fas fa-trash" aria-hidden="true" /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <FormModal title={eventoEditar ? 'Editar Evento Institucional' : 'Nuevo Evento Institucional'} onClose={() => setModalAbierto(false)}>
          <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ev-tipo">Tipo de evento</label>
                <select id="ev-tipo" className="form-control" value={form.tipo_evento} onChange={(e) => setForm({ ...form, tipo_evento: e.target.value })}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ev-fecha">Fecha</label>
                <input id="ev-fecha" type="date" className="form-control" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ev-desc">Descripción</label>
              <input id="ev-desc" type="text" className="form-control" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Feriado nacional, Suspensión por corte de energía..." />
            </div>

            <div className="form-group">
              <label>Vigencia</label>
              <div className="flex-row" style={{ gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="vigencia" checked={!form.permanente} onChange={() => setForm({ ...form, permanente: false })} />
                  Temporal
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="vigencia" checked={form.permanente} onChange={() => setForm({ ...form, permanente: true })} />
                  Permanente (se repite todos los años)
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Alcance horario</label>
              <div className="flex-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                {ALCANCE_OPCIONES.map((op) => (
                  <label key={op.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="alcance" checked={form.alcance === op.value} onChange={() => setForm({ ...form, alcance: op.value })} />
                    {op.label}
                  </label>
                ))}
              </div>
            </div>

            {form.alcance === 'franja' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ev-hini">Hora inicio</label>
                  <input id="ev-hini" type="time" className="form-control" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="ev-hfin">Hora fin</label>
                  <input id="ev-hfin" type="time" className="form-control" value={form.hora_fin} onChange={(e) => setForm({ ...form, hora_fin: e.target.value })} />
                </div>
              </div>
            )}

            {mensaje && (
              <p style={{ color: mensaje.startsWith('Error') ? '#ff6b6b' : '#51cf66', margin: '8px 0' }}>{mensaje}</p>
            )}
          </div>

          <div className="standard-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
              {guardando ? 'Guardando...' : (eventoEditar ? 'Guardar Cambios' : 'Crear Evento')}
            </button>
          </div>
        </FormModal>
      )}
    </div>
  );
}

export default CalendarioInstitucional;
