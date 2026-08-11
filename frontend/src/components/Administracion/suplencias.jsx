import { Fragment, useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { getSuplencias, createSuplencia, updateSuplencia, deleteSuplencia, finalizarSuplencia } from '../../services/api';
import FormModal from '../../components/Shared/FormModal';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import LoadingSpinner from '../Shared/LoadingSpinner';

const formVacio = {
  id_curso_materia: '',
  id_docente_suplente: '',
  nivel: 1,
  motivo: '',
  fecha_inicio: '',
  fecha_fin: '',
  modoNuevoDocente: false,
  nuevoDocente: { nombre: '', apellido: '', dni: '', usuario_nombre: '', contrasena: '', correo: '', telefono: '' },
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

function FormSuplencia({ formData, setFormData, editing, guardando, onSubmit, onCancel }) {
  const { cursoMateria, docentes } = useData();

  const cursos = useMemo(() => {
    const mapa = new Map();
    (cursoMateria ?? []).forEach((cm) => {
      if (cm.id_curso && !mapa.has(cm.id_curso)) {
        mapa.set(cm.id_curso, cm.curso_nombre || 'Curso sin nombre');
      }
    });
    return [...mapa.entries()].map(([id_curso, curso_nombre]) => ({ id_curso, curso_nombre }));
  }, [cursoMateria]);

  const materiasDelCurso = useMemo(() => {
    if (!formData.id_curso) return [];
    return (cursoMateria ?? []).filter((cm) => cm.id_curso === formData.id_curso);
  }, [cursoMateria, formData.id_curso]);

  const cursoSeleccionado = formData.id_curso
    ? (cursoMateria ?? []).find((cm) => cm.id_curso === formData.id_curso)
    : null;

  const alCambiarCurso = (idCurso) => {
    setFormData((p) => ({ ...p, id_curso: idCurso ? Number(idCurso) : '', id_curso_materia: '' }));
  };

  return (
    <FormModal title={editing ? 'Modificar suplencia' : 'Nueva suplencia'} onClose={onCancel}>
      <form onSubmit={onSubmit}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="form-group-filter">
            <label htmlFor="sup-curso">Curso / División</label>
            <select id="sup-curso" value={formData.id_curso || ''} onChange={(e) => alCambiarCurso(e.target.value)} required>
              <option value="">Seleccione un curso...</option>
              {cursos.map((c) => (
                <option key={c.id_curso} value={c.id_curso}>{c.curso_nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="sup-materia">Materia asignada</label>
            <select id="sup-materia" value={formData.id_curso_materia || ''} onChange={(e) => setFormData((p) => ({ ...p, id_curso_materia: e.target.value ? Number(e.target.value) : '' }))} required>
              <option value="">Seleccione una materia...</option>
              {materiasDelCurso.map((cm) => (
                <option key={cm.id} value={cm.id}>
                  {cm.materia_nombre} {cm.docente_nombre ? `— Titular: ${cm.docente_nombre}` : ''}
                </option>
              ))}
            </select>
            {cursoSeleccionado && (
              <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
                Docente titular actual: {cursoSeleccionado.docente_nombre || '—'}
              </small>
            )}
          </div>

          <div>
            <div className="form-group-filter">
              <label htmlFor="sup-modo">Docente suplente</label>
              <select
                id="sup-modo"
                value={formData.modoNuevoDocente ? 'nuevo' : 'existente'}
                onChange={(e) => setFormData((p) => ({
                  ...p,
                  modoNuevoDocente: e.target.value === 'nuevo',
                  id_docente_suplente: e.target.value === 'nuevo' ? '' : p.id_docente_suplente,
                }))}
              >
                <option value="existente">Seleccionar docente existente</option>
                <option value="nuevo">Crear nuevo docente</option>
              </select>
            </div>

            {formData.modoNuevoDocente ? (
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group-filter">
                  <label htmlFor="sup-nombre">Nombre</label>
                  <input id="sup-nombre" type="text" value={formData.nuevoDocente.nombre} onChange={(e) => setFormData((p) => ({ ...p, nuevoDocente: { ...p.nuevoDocente, nombre: e.target.value } }))} required />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="sup-apellido">Apellido</label>
                  <input id="sup-apellido" type="text" value={formData.nuevoDocente.apellido} onChange={(e) => setFormData((p) => ({ ...p, nuevoDocente: { ...p.nuevoDocente, apellido: e.target.value } }))} required />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="sup-dni">DNI</label>
                  <input id="sup-dni" type="text" inputMode="numeric" value={formData.nuevoDocente.dni} onChange={(e) => setFormData((p) => ({ ...p, nuevoDocente: { ...p.nuevoDocente, dni: e.target.value.replace(/\D/g, '') } }))} required />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="sup-usuario">Usuario</label>
                  <input id="sup-usuario" type="text" value={formData.nuevoDocente.usuario_nombre} onChange={(e) => setFormData((p) => ({ ...p, nuevoDocente: { ...p.nuevoDocente, usuario_nombre: e.target.value } }))} required />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="sup-contrasena">Contraseña</label>
                  <input id="sup-contrasena" type="password" value={formData.nuevoDocente.contrasena} onChange={(e) => setFormData((p) => ({ ...p, nuevoDocente: { ...p.nuevoDocente, contrasena: e.target.value } }))} required={!editing} />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="sup-correo">Correo (opcional)</label>
                  <input id="sup-correo" type="email" value={formData.nuevoDocente.correo} onChange={(e) => setFormData((p) => ({ ...p, nuevoDocente: { ...p.nuevoDocente, correo: e.target.value } }))} />
                </div>
              </div>
            ) : (
              <div className="form-group-filter">
                <label htmlFor="sup-docente">Seleccionar docente</label>
                <select id="sup-docente" value={formData.id_docente_suplente || ''} onChange={(e) => setFormData((p) => ({ ...p, id_docente_suplente: e.target.value ? Number(e.target.value) : '' }))} required>
                  <option value="">Seleccione un docente...</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>{d.apellido}, {d.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-group-filter">
            <label htmlFor="sup-nivel">Nivel de suplencia</label>
            <select id="sup-nivel" value={formData.nivel || 1} onChange={(e) => setFormData((p) => ({ ...p, nivel: Number(e.target.value) }))}>
              <option value={1}>Nivel 1 (reemplaza al titular)</option>
              <option value={2}>Nivel 2 (reemplaza a nivel 1)</option>
              <option value={3}>Nivel 3 (reemplaza a nivel 2)</option>
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="sup-motivo">Motivo</label>
            <textarea
              id="sup-motivo"
              rows={2}
              value={formData.motivo || ''}
              onChange={(e) => setFormData((p) => ({ ...p, motivo: e.target.value }))}
              placeholder="Ej.: Licencia por salud, capacitación..."
            />
          </div>

          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group-filter">
              <label htmlFor="sup-inicio">Fecha de inicio</label>
              <input id="sup-inicio" type="date" value={formData.fecha_inicio || ''} onChange={(e) => setFormData((p) => ({ ...p, fecha_inicio: e.target.value }))} required />
            </div>
            <div className="form-group-filter">
              <label htmlFor="sup-fin">Fecha de fin</label>
              <input id="sup-fin" type="date" value={formData.fecha_fin || ''} onChange={(e) => setFormData((p) => ({ ...p, fecha_fin: e.target.value }))} required />
            </div>
          </div>
        </div>
        <div className="standard-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

function GestionSuplencias() {
  const { cursoMateria, refreshData } = useData();
  const toast = useToast();
  const [suplencias, setSuplencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getSuplencias();
      setSuplencias(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiar = () => {
    setShowForm(false);
    setEditing(null);
    setFormData(formVacio);
  };

  const abrirNuevo = () => {
    limpiar();
    setShowForm(true);
  };

  const abrirEditar = (s) => {
    limpiar();
    setEditing(s);
    const cmAsoc = (cursoMateria ?? []).find((cm) => cm.id === s.id_curso_materia);
    const cm = {
      ...formVacio,
      id_curso: cmAsoc?.id_curso || '',
      id_curso_materia: s.id_curso_materia,
      id_docente_suplente: s.id_docente_suplente || '',
      nivel: s.nivel || 1,
      motivo: s.motivo || '',
      fecha_inicio: s.fecha_inicio || '',
      fecha_fin: s.fecha_fin || '',
    };
    setFormData(cm);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        id_curso_materia: formData.id_curso_materia,
        nivel: Number(formData.nivel) || 1,
        motivo: formData.motivo || '',
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
      };
      if (formData.modoNuevoDocente) {
        const nuevo = {
          nombre: formData.nuevoDocente.nombre,
          apellido: formData.nuevoDocente.apellido,
          dni: formData.nuevoDocente.dni,
          usuario_nombre: formData.nuevoDocente.usuario_nombre,
          contrasena: formData.nuevoDocente.contrasena,
        };
        if (formData.nuevoDocente.correo) nuevo.correo = formData.nuevoDocente.correo;
        if (formData.nuevoDocente.telefono) nuevo.telefono = formData.nuevoDocente.telefono;
        payload.nuevo_docente = nuevo;
      } else {
        payload.id_docente_suplente = Number(formData.id_docente_suplente) || null;
      }

      if (editing) {
        await updateSuplencia(editing.id_suplencia, payload);
        toast.success('Suplencia actualizada correctamente.');
      } else {
        await createSuplencia(payload);
        toast.success('Suplencia creada correctamente.');
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

  const handleFinalizar = async (s) => {
    await confirmarEliminacion(
      '¿Finalizar esta suplencia?\n\n' +
      'El docente titular volverá a tener el control de la materia.\n\n' +
      'La suplencia quedará registrada como finalizada.\n\n' +
      '¿Desea continuar?',
      {
        confirmText: 'Finalizar',
        loadingText: 'Finalizando...',
        onConfirm: async () => {
          try {
            await finalizarSuplencia(s.id_suplencia);
            toast.success('Suplencia finalizada correctamente.');
            await cargar();
            await refreshData();
          } catch (err) {
            toast.error(mensajeError(err));
          }
        },
      },
    );
  };

  const handleEliminar = async (s) => {
    await confirmarEliminacion(
      '¿Eliminar esta suplencia?\n\n' +
      'Se eliminará el registro de la lista.\n\n' +
      '¿Desea continuar?',
      {
        onConfirm: async () => {
          try {
            await deleteSuplencia(s.id_suplencia);
            toast.success('Suplencia eliminada correctamente.');
            await cargar();
            await refreshData();
          } catch (err) {
            toast.error(mensajeError(err));
          }
        },
      },
    );
  };

  return (
    <div>
      <div className="flex-row--between mb-16">
        <p className="m-0" style={{ color: '#555' }}>
          Registro de suplencias por materia. El docente activo (titular o suplente vigente) es quien opera la materia.
        </p>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          <i className="fas fa-plus" aria-hidden="true" /> Nueva Suplencia
        </button>
      </div>

      {showForm && (
        <FormSuplencia
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
              <th>Docente Titular</th>
              <th>Docente Suplente</th>
              <th>Nivel</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Docente Activo Hoy</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={10} className="empty-state-message"><LoadingSpinner text="Cargando suplencias..." size="sm" inline /></td></tr>
            ) : suplencias.length === 0 ? (
              <tr><td colSpan={10} className="empty-state-message">No hay suplencias registradas.</td></tr>
            ) : (
              suplencias.map((s) => (
                <Fragment key={s.id_suplencia}>
                  <tr>
                    <td>{s.curso_nombre || '—'}</td>
                    <td>{s.materia_nombre || '—'}</td>
                    <td>{s.titular_nombre || '—'}</td>
                    <td>{s.suplente_nombre || '—'}</td>
                    <td>Nivel {s.nivel ?? 1}</td>
                    <td>{fmtFecha(s.fecha_inicio)}</td>
                    <td>{fmtFecha(s.fecha_fin)}</td>
                    <td>
                      {s.docente_activo_hoy ? (
                        <span className={`badge ${s.docente_activo_hoy.es_suplencia ? 'badge-warning' : 'badge-success'}`}>
                          {s.docente_activo_hoy.nombre}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${s.estado ? 'badge-success' : 'badge-neutral'}`}>
                        {s.estado_label || (s.estado ? 'Activa' : 'Finalizada')}
                      </span>
                    </td>
                    <td className="acciones-cell flex-row--center">
                      {s.estado ? (
                        <div>
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => abrirEditar(s)} aria-label="Modificar suplencia" title="Modificar"><i className="fas fa-edit" aria-hidden="true" /></button>
                          <button type="button" className="btn btn-sm btn-success" onClick={() => handleFinalizar(s)} aria-label="Finalizar suplencia" title="Finalizar"><i className="fas fa-flag-checkered" aria-hidden="true" /></button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(s)} aria-label="Eliminar suplencia" title="Eliminar"><i className="fas fa-trash-alt" aria-hidden="true" /></button>
                        </div>
                      ) : (
                        <div>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleEliminar(s)} aria-label="Eliminar suplencia" title="Eliminar"><i className="fas fa-trash-alt" aria-hidden="true" /></button>
                        </div>
                      )}
                    </td>
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

function Suplencias() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="m-0">Suplencias Docentes</h2>
      </div>
      <div className="card-body">
        <GestionSuplencias />
      </div>
    </div>
  );
}

export default Suplencias;
