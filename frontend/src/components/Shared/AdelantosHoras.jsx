import { Fragment, useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { getAdelantosHoras, createAdelantoHoras, updateAdelantoHoras, deleteAdelantoHoras } from '../../services/api';
import FormModal from './FormModal';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import LoadingSpinner from './LoadingSpinner';

const formVacio = {
  id_docente: '',
  id_curso: '',
  id_materia: '',
  fecha_adelanto: '',
  modulosSel: [],
  mantener: 0,
  motivo: '',
};

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.values(data).flat().join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function fmtFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function calcularFranja(modulos, ids) {
  const sel = (modulos ?? [])
    .filter((m) => ids.includes(m.id_modulo))
    .sort((a, b) => String(a.hora_inicio).localeCompare(String(b.hora_inicio)));
  if (sel.length === 0) {
    return { mods: [], inicio: null, fin: null, consecutivos: true };
  }
  let consecutivos = true;
  for (let i = 1; i < sel.length; i += 1) {
    if (String(sel[i].hora_inicio) !== String(sel[i - 1].hora_fin)) {
      consecutivos = false;
      break;
    }
  }
  return {
    mods: sel,
    inicio: String(sel[0].hora_inicio).slice(0, 5),
    fin: String(sel[sel.length - 1].hora_fin).slice(0, 5),
    consecutivos,
  };
}

function FormAdelanto({ formData, setFormData, editing, guardando, onSubmit, onCancel }) {
  const { cursoMateria, docentes, modulos } = useData();

  const asignacionesDelDocente = useMemo(() => {
    if (!formData.id_docente) return [];
    return (cursoMateria ?? []).filter((cm) => Number(cm.id_docente) === Number(formData.id_docente));
  }, [cursoMateria, formData.id_docente]);

  const docentesConAsignacion = useMemo(() => {
    const ids = new Set((cursoMateria ?? [])
      .filter((cm) => cm.id_docente != null)
      .map((cm) => Number(cm.id_docente)));
    return (docentes ?? []).filter((d) => ids.has(Number(d.id)));
  }, [cursoMateria, docentes]);

  const cursosDelDocente = useMemo(() => {
    const mapa = new Map();
    asignacionesDelDocente.forEach((cm) => {
      if (cm.id_curso != null && !mapa.has(Number(cm.id_curso))) {
        mapa.set(Number(cm.id_curso), cm.curso_nombre || 'Curso');
      }
    });
    return [...mapa.entries()].map(([id_curso, curso_nombre]) => ({ id_curso, curso_nombre }));
  }, [asignacionesDelDocente]);

  const materiasDelCurso = useMemo(() => {
    const mapa = new Map();
    asignacionesDelDocente
      .filter((cm) => Number(cm.id_curso) === Number(formData.id_curso))
      .forEach((cm) => {
        if (cm.id_materia != null && !mapa.has(Number(cm.id_materia))) {
          mapa.set(Number(cm.id_materia), cm.materia_nombre || 'Materia');
        }
      });
    return [...mapa.entries()].map(([id_materia, materia_nombre]) => ({ id_materia, materia_nombre }));
  }, [asignacionesDelDocente, formData.id_curso]);

  const modulosOrdenados = useMemo(() => {
    return (modulos ?? []).slice().sort((a, b) =>
      String(a.hora_inicio).localeCompare(String(b.hora_inicio)),
    );
  }, [modulos]);

  const franja = useMemo(
    () => calcularFranja(modulosOrdenados, formData.modulosSel),
    [modulosOrdenados, formData.modulosSel],
  );

  const alCambiarDocente = (idDocente) => {
    setFormData((p) => ({
      ...p,
      id_docente: idDocente ? Number(idDocente) : '',
      id_curso: '',
      id_materia: '',
      modulosSel: [],
    }));
  };

  const alCambiarCurso = (idCurso) => {
    setFormData((p) => ({
      ...p,
      id_curso: idCurso ? Number(idCurso) : '',
      id_materia: '',
      modulosSel: [],
    }));
  };

  const alCambiarMateria = (idMateria) => {
    setFormData((p) => ({
      ...p,
      id_materia: idMateria ? Number(idMateria) : '',
      modulosSel: [],
    }));
  };

  const toggleModulo = (idModulo) => {
    setFormData((p) => {
      const yaEsta = p.modulosSel.includes(Number(idModulo));
      const modulosSel = yaEsta
        ? p.modulosSel.filter((id) => id !== Number(idModulo))
        : [...p.modulosSel, Number(idModulo)];
      return { ...p, modulosSel };
    });
  };

  return (
    <FormModal title={editing ? 'Modificar adelanto de horas' : 'Nuevo adelanto de horas'} onClose={onCancel}>
      <form onSubmit={onSubmit}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="form-group-filter">
            <label htmlFor="adh-docente">Docente</label>
            <select id="adh-docente" value={formData.id_docente || ''} onChange={(e) => alCambiarDocente(e.target.value)} required>
              <option value="">Seleccione un docente...</option>
              {docentesConAsignacion.map((d) => (
                <option key={d.id} value={d.id}>{d.apellido}, {d.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="adh-curso">Curso</label>
            <select id="adh-curso" value={formData.id_curso || ''} onChange={(e) => alCambiarCurso(e.target.value)} required disabled={!formData.id_docente}>
              <option value="">Seleccione un curso...</option>
              {cursosDelDocente.map((c) => (
                <option key={c.id_curso} value={c.id_curso}>{c.curso_nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="adh-materia">Materia</label>
            <select id="adh-materia" value={formData.id_materia || ''} onChange={(e) => alCambiarMateria(e.target.value)} required disabled={!formData.id_curso}>
              <option value="">Seleccione una materia...</option>
              {materiasDelCurso.map((m) => (
                <option key={m.id_materia} value={m.id_materia}>{m.materia_nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="adh-fecha">Fecha del adelanto</label>
            <input id="adh-fecha" type="date" value={formData.fecha_adelanto || ''} onChange={(e) => setFormData((p) => ({ ...p, fecha_adelanto: e.target.value }))} required />
          </div>

          <div>
            <span className="adelanto-etiqueta">Módulos a adelantar</span>
            <div className="modulos-grilla">
              {modulosOrdenados.length === 0 ? (
                <p className="empty-state-message">No hay módulos definidos en el sistema.</p>
              ) : (
                modulosOrdenados.map((m) => {
                  const seleccionado = formData.modulosSel.includes(Number(m.id_modulo));
                  return (
                    <label
                      key={m.id_modulo}
                      className={`modulo-card ${seleccionado ? 'modulo-card--checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => toggleModulo(m.id_modulo)}
                      />
                      <span className="modulo-card__info">
                        <span className="modulo-card__nombre">{m.nombre}</span>
                        <span className="modulo-card__horario">
                          {String(m.hora_inicio).slice(0, 5)} - {String(m.hora_fin).slice(0, 5)}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {formData.modulosSel.length > 0 && (
            <div>
              {franja.consecutivos ? (
                <p className="adelanto-aviso adelanto-aviso--ok">
                  <strong>Horario seleccionado:</strong> {franja.inicio} - {franja.fin}
                </p>
              ) : (
                <p className="adelanto-aviso adelanto-aviso--warn">
                  Los módulos seleccionados deben ser consecutivos.
                </p>
              )}
            </div>
          )}

          <div>
            <span className="adelanto-etiqueta">¿Qué debe pasar con la clase habitual?</span>
            <div style={{ display: 'grid', gap: '8px' }}>
              {[
                {
                  value: 0,
                  titulo: 'Reemplazar la clase habitual',
                  desc: 'La clase adelantada reemplaza la clase habitual. El docente NO dará ambas clases.',
                },
                {
                  value: 1,
                  titulo: 'Mantener ambas clases',
                  desc: 'El docente dará la clase adelantada y también conservará su clase habitual.',
                },
              ].map((op) => (
                <label
                  key={op.value}
                  className={`opcion-radio ${formData.mantener === op.value ? 'opcion-radio--checked' : ''}`}
                >
                  <input
                    type="radio"
                    name="mantener-horario"
                    value={op.value}
                    checked={formData.mantener === op.value}
                    onChange={() => setFormData((p) => ({ ...p, mantener: op.value }))}
                  />
                  <span className="opcion-radio__contenido">
                    <strong className="opcion-radio__titulo">{op.titulo}</strong>
                    <small className="opcion-radio__descripcion">{op.desc}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group-filter">
            <label htmlFor="adh-motivo">Motivo</label>
            <textarea
              id="adh-motivo"
              rows={2}
              value={formData.motivo || ''}
              onChange={(e) => setFormData((p) => ({ ...p, motivo: e.target.value }))}
              placeholder="Ej.: Ausencia del docente de las primeras horas..."
            />
          </div>
        </div>
        <div className="standard-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : (editing ? 'Actualizar' : 'Autorizar adelanto')}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

function GestionAdelantosHoras({ readOnly = false }) {
  const { modulos, refreshData } = useData();
  const toast = useToast();
  const [adelantos, setAdelantos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [soloActivos, setSoloActivos] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getAdelantosHoras(soloActivos ? { estado: 1 } : {});
      setAdelantos(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloActivos]);

  const limpiar = () => {
    setShowForm(false);
    setEditing(null);
    setFormData(formVacio);
  };

  const abrirNuevo = () => {
    limpiar();
    setShowForm(true);
  };

  const abrirEditar = (a) => {
    limpiar();
    setEditing(a);
    setFormData({
      id_docente: a.id_docente || '',
      id_curso: a.id_curso || '',
      id_materia: a.id_materia || '',
      fecha_adelanto: a.fecha_adelanto || '',
      modulosSel: (Array.isArray(a.modulos_detalle) ? a.modulos_detalle : [])
        .map((m) => Number(m.id_modulo))
        .filter(Boolean),
      mantener: a.mantener_horario_original ? 1 : 0,
      motivo: a.motivo || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_docente || !formData.id_curso || !formData.id_materia) {
      toast.error('Debe seleccionar docente, curso y materia.');
      return;
    }
    if (!formData.fecha_adelanto) {
      toast.error('Debe indicar la fecha del adelanto.');
      return;
    }
    if (formData.modulosSel.length === 0) {
      toast.error('Debe seleccionar al menos un módulo.');
      return;
    }
    const franja = calcularFranja(modulos, formData.modulosSel);
    if (!franja.consecutivos) {
      toast.error('Los módulos seleccionados deben ser consecutivos.');
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        id_docente: Number(formData.id_docente),
        id_curso: Number(formData.id_curso),
        id_materia: Number(formData.id_materia),
        fecha_adelanto: formData.fecha_adelanto,
        modulos: formData.modulosSel,
        mantener_horario_original: formData.mantener === 1,
        motivo: formData.motivo || '',
      };
      if (editing) {
        await updateAdelantoHoras(editing.id_adelanto, payload);
        toast.success('Adelanto de horas actualizado correctamente.');
      } else {
        await createAdelantoHoras(payload);
        toast.success('Adelanto de horas autorizado correctamente.');
      }
      limpiar();
      await cargar();
      await refreshData();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (a) => {
    await confirmarEliminacion(
      '¿Eliminar este adelanto de horas?\n\n' +
      'El registro quedará marcado como eliminado y la clase volverá al horario normal.\n\n' +
      '¿Desea continuar?',
      {
        onConfirm: async () => {
          try {
            await deleteAdelantoHoras(a.id_adelanto);
            toast.success('Adelanto de horas eliminado correctamente.');
            await cargar();
            await refreshData();
          } catch (err) {
            toast.error(mensajeError(err));
          }
        },
      },
    );
  };

  const badgeEstado = (a) => {
    if (!a.estado) return <span className="badge badge-neutral">Eliminado</span>;
    if (a.finalizado) return <span className="badge badge-neutral">Finalizado</span>;
    return <span className="badge badge-success">Activo</span>;
  };

  return (
    <div>
      <div className="flex-row--between mb-16">
        <p className="m-0" style={{ color: '#555' }}>
          Autorización excepcional para que un docente dicte una materia fuera del horario habitual.
        </p>
        {!readOnly && (
          <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
            <i className="fas fa-plus" aria-hidden="true" /> Nuevo Adelanto
          </button>
        )}
      </div>

      <div className="filter-row mb-12">
        <label className="filtro-checkbox">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
          />
          <span>Mostrar solo adelantos activos</span>
        </label>
      </div>

      {showForm && (
        <FormAdelanto
          formData={formData}
          setFormData={setFormData}
          editing={editing}
          guardando={guardando}
          onSubmit={handleSubmit}
          onCancel={limpiar}
        />
      )}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Curso / División</th>
              <th>Materia</th>
              <th>Docente</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Módulos</th>
              <th>Horario original</th>
              <th>Motivo</th>
              <th>Autorizado por</th>
              <th>Estado</th>
              {!readOnly && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={!readOnly ? 11 : 10} className="empty-state-message"><LoadingSpinner text="Cargando adelantos..." size="sm" inline /></td></tr>
            ) : adelantos.length === 0 ? (
              <tr><td colSpan={!readOnly ? 11 : 10} className="empty-state-message">No hay adelantos de horas registrados.</td></tr>
            ) : (
              adelantos.map((a) => (
                <Fragment key={a.id_adelanto}>
                  <tr>
                    <td>{a.curso_nombre || '—'}</td>
                    <td>{a.materia_nombre || '—'}</td>
                    <td>{a.docente_nombre || '—'}</td>
                    <td>{fmtFecha(a.fecha_adelanto)}</td>
                    <td>
                      {a.hora_inicio ? `${String(a.hora_inicio).slice(0, 5)} a ${String(a.hora_fin).slice(0, 5)}` : '—'}
                    </td>
                    <td>
                      {Array.isArray(a.modulos_detalle) && a.modulos_detalle.length > 0
                        ? a.modulos_detalle.map((m) => m.nombre).join(', ')
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${a.mantener_horario_original ? 'badge-success' : 'badge-warning'}`}>
                        {a.mantener_horario_original ? 'Se mantiene' : 'Cancelado'}
                      </span>
                    </td>
                    <td>{a.motivo || '—'}</td>
                    <td>{a.autorizador_nombre || '—'}</td>
                    <td>{badgeEstado(a)}</td>
                    {!readOnly && (
                      <td className="acciones-cell flex-row--center">
                        {a.estado ? (
                          <div>
                            {!a.finalizado && (
                              <button type="button" className="btn btn-sm btn-secondary" onClick={() => abrirEditar(a)} aria-label="Modificar adelanto" title="Modificar"><i className="fas fa-edit" aria-hidden="true" /></button>
                            )}
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(a)} aria-label="Eliminar adelanto" title="Eliminar"><i className="fas fa-trash-alt" aria-hidden="true" /></button>
                          </div>
                        ) : (
                          <div>
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(a)} aria-label="Eliminar adelanto" title="Eliminar"><i className="fas fa-trash-alt" aria-hidden="true" /></button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdelantosHoras({ readOnly = false }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="m-0">Adelantos de Horas</h2>
      </div>
      <div className="card-body">
        <GestionAdelantosHoras readOnly={readOnly} />
      </div>
    </div>
  );
}

export default AdelantosHoras;
