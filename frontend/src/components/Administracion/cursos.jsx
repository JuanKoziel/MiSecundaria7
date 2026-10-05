import { Fragment, useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { createCurso, updateCurso } from '../../services/api';
import FormModal from '../../components/Shared/FormModal';
import AccionesCelda from '../../components/Shared/AccionesCelda';
import NumericInput from '../../components/Shared/NumericInput';
import AvisoDatosMaestros from '../../components/Shared/AvisoDatosMaestros';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { mensajeErrorAmigable } from '../../utils/errores';

const formVacio = {
  anio: '',
  division: '',
  orientacion: '',
  id_preceptor: '',
  id_ciclo: '',
};

function mensajeError(err) {
  return mensajeErrorAmigable(err);
}

function FormCurso({ formData, setFormData, editing, guardando, onSubmit, onCancel, ciclosLectivos, preceptores, error, onClearError }) {
  // Sin ciclos lectivos cargados el select queda vacío y no hay a dónde ir:
  // se muestra el aviso con acceso directo a Configuración en su lugar.
  const sinCiclos = (ciclosLectivos || []).length === 0;

  return (
    <FormModal title={editing ? 'Editar curso' : 'Nuevo curso'} onClose={onCancel} error={error} onClearError={onClearError}>
      <form onSubmit={onSubmit} style={{ position: 'relative' }}>
        <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
          <div className="preceptor-form-row preceptor-form-row--two">
            <NumericInput
              id="curso-anio"
              label="Año"
              value={formData.anio}
              onChange={(val) => setFormData((p) => ({ ...p, anio: val }))}
              required
              min={1}
              max={7}
              placeholder="1-7"
            />
            <NumericInput
              id="curso-division"
              label="División"
              value={formData.division}
              onChange={(val) => setFormData((p) => ({ ...p, division: val }))}
              required
              min={1}
              max={20}
              placeholder="1-20"
            />
          </div>
          <div className="preceptor-form-row preceptor-form-row--two">
            <div className="form-group-filter">
              <label htmlFor="curso-orientacion">Orientación</label>
              <input id="curso-orientacion" type="text" value={formData.orientacion} onChange={(e) => setFormData((p) => ({ ...p, orientacion: e.target.value }))} />
            </div>
            <div className="form-group-filter">
              <label htmlFor="curso-preceptor">Preceptor</label>
              <select id="curso-preceptor" value={formData.id_preceptor} onChange={(e) => setFormData((p) => ({ ...p, id_preceptor: e.target.value }))}>
                <option value="">— Sin asignar —</option>
                {(preceptores || []).map((p) => (
                  <option key={p.id_preceptor} value={p.id_preceptor}>{p.apellido}, {p.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="preceptor-form-row">
            <div className="form-group-filter">
              <label htmlFor="curso-ciclo">Ciclo lectivo</label>
              {sinCiclos ? (
                <AvisoDatosMaestros
                  mensaje="No hay ciclos lectivos registrados. Cree un ciclo lectivo antes de crear un curso."
                  accion="Crear ciclo lectivo"
                  destino="ciclos_lectivos"
                />
              ) : (
                <select id="curso-ciclo" value={formData.id_ciclo} onChange={(e) => setFormData((p) => ({ ...p, id_ciclo: e.target.value }))} required>
                  <option value="">Seleccionar...</option>
                  {(ciclosLectivos || []).map((c) => (
                    <option key={c.id_ciclo} value={c.id_ciclo}>{c.anio}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        <div className="standard-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando || sinCiclos}>
            {guardando ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

function Cursos() {
  const { adminCursos, refreshAdminCursos, ciclosLectivos, preceptores } = useData();
  const toast = useToast();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(formVacio);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    refreshAdminCursos(mostrarInactivos);
  }, [mostrarInactivos, refreshAdminCursos]);

  const parsearNombreCurso = (nombre) => {
    if (!nombre || !nombre.includes('°')) return { anio: '', division: '' };
    const parts = nombre.split('°');
    return { anio: parts[0] || '', division: parts.length > 1 ? parts[1] : '' };
  };

  const limpiar = () => {
    setShowNewForm(false);
    setEditing(null);
    setFormData(formVacio);
    setError('');
    setSuccess('');
  };

  const abrirNuevo = () => {
    limpiar();
    setShowNewForm(true);
  };

  const abrirEditar = (curso) => {
    limpiar();
    const { anio, division } = parsearNombreCurso(curso.nombre_curso);
    setEditing(curso);
    setFormData({
      anio,
      division,
      orientacion: curso.orientacion || '',
      id_preceptor: curso.id_preceptor ?? '',
      id_ciclo: curso.id_ciclo ?? '',
    });
  };

  const construirNombreCurso = (anio, division) => `${anio}°${division}`;

  const handleSubmit = async (e, esEdicion) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGuardando(true);
    try {
      const payload = {
        nombre_curso: construirNombreCurso(formData.anio, formData.division),
        orientacion: formData.orientacion || null,
        id_preceptor: formData.id_preceptor ? Number(formData.id_preceptor) : null,
        id_ciclo: formData.id_ciclo ? Number(formData.id_ciclo) : null,
      };
      if (esEdicion) {
        await updateCurso(editing.id_curso, payload);
        toast.success('Curso actualizado correctamente.');
      } else {
        await createCurso(payload);
        toast.success('Curso creado correctamente.');
      }
      limpiar();
      await refreshAdminCursos(mostrarInactivos);
    } catch (err) {
      setError(mensajeError(err));
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = async (curso) => {
    await confirmarEliminacion(
      'Este curso dejará de estar disponible para nuevas operaciones.\n\n' +
      'No se eliminará ningún dato histórico.\n\n' +
      'Se conservarán:\n' +
      '• estudiantes\n• horarios\n• actividades\n• asistencias\n' +
      '• calificaciones\n• planificaciones\n• comunicaciones\n\n' +
      '¿Desea continuar?',
      {
        confirmText: 'Desactivar',
        loadingText: 'Desactivando...',
        onConfirm: async () => {
          setError('');
          setSuccess('');
          try {
            await updateCurso(curso.id_curso, { activo: false });
            toast.success('Curso desactivado correctamente.');
            await refreshAdminCursos(mostrarInactivos);
          } catch (err) {
            toast.error(mensajeError(err));
          }
        },
      },
    );
  };

  const handleReactivar = async (curso) => {
    setError('');
    setSuccess('');
    try {
      await updateCurso(curso.id_curso, { activo: true });
      toast.success('Curso reactivado correctamente.');
      await refreshAdminCursos(mostrarInactivos);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const cursoNombre = (curso) => curso.nombre_curso || '';

  return (
    <div className="card">
      <div className="card-header">
        <h2><i className="fas fa-school" aria-hidden="true" /> Gestión de Cursos</h2>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="flex-row--between mb-16">
          <label style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} style={{ marginRight: '8px' }} />
            Mostrar registros inactivos
          </label>
          <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
            <i className="fas fa-plus" aria-hidden="true" /> Nuevo Curso
          </button>
        </div>

        {showNewForm && (
          <FormCurso
            formData={formData}
            setFormData={setFormData}
            editing={null}
            guardando={guardando}
            onSubmit={(e) => handleSubmit(e, false)}
            onCancel={limpiar}
            ciclosLectivos={ciclosLectivos}
            preceptores={preceptores}
            error={error}
            onClearError={() => setError('')}
          />
        )}

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Orientación</th>
                <th>Preceptor</th>
                <th>Ciclo Lectivo</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {adminCursos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-message">No hay cursos registrados.</td>
                </tr>
              ) : (
                adminCursos.map((c) => (
                  <Fragment key={c.id_curso}>
                    <tr>
                      <td>{cursoNombre(c)}</td>
                      <td>{c.orientacion || '---'}</td>
                      <td>{c.preceptor_nombre || '---'}</td>
                      <td>{c.ciclo_anio || '---'}</td>
                      <td>
                        <span className={`badge ${c.activo ? 'badge-success' : 'badge-danger'}`}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <AccionesCelda
                      acciones={c.activo ? [
                        { accion: 'editar', onClick: () => abrirEditar(c) },
                        { accion: 'deshabilitar', onClick: () => handleDesactivar(c) },
                      ] : [
                        { accion: 'habilitar', onClick: () => handleReactivar(c) },
                      ]}
                      entidad="curso"
                    />
                    </tr>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {editing && (
          <FormCurso
            formData={formData}
            setFormData={setFormData}
            editing={editing}
            guardando={guardando}
            onSubmit={(e) => handleSubmit(e, true)}
            onCancel={limpiar}
            ciclosLectivos={ciclosLectivos}
            preceptores={preceptores}
            error={error}
            onClearError={() => setError('')}
          />
        )}
      </div>
    </div>
  );
}

export default Cursos;
