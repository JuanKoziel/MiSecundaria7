import { useState, useEffect, useMemo } from 'react';
import {
  getActividadesMateriasAdeudadas,
  createActividadMateriaAdeudada,
  updateActividadMateriaAdeudada,
  deleteActividadMateriaAdeudada,
  uploadFile
} from '../../services/api';
import FormModal from '../Shared/FormModal';
import FilePicker from '../Shared/FilePicker';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { useToast } from '../../context/ToastContext';
import { mensajeErrorAmigable } from '../../utils/errores';

function mensajeError(err) {
  return mensajeErrorAmigable(err);
}

function PanelMateriasAdeudadasDocente({ cursoMateriaId, misAsignaciones }) {
  const toast = useToast();

  // Intensificaciones state
  const [actividades, setActividades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalCursoId, setModalCursoId] = useState('');
  const [modalMateriaNombre, setModalMateriaNombre] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('INTENSIFICACION');
  const [periodoIntensificacion, setPeriodoIntensificacion] = useState('Intensificación del primer cuatrimestre');
  const [archivo, setArchivo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [archivoActual, setArchivoActual] = useState(null);
  const [loadingAct, setLoadingAct] = useState(false);

  const modalCursoMateriaObj = misAsignaciones.find(
    (cm) => String(cm.id_curso) === String(modalCursoId) && cm.materia_nombre === modalMateriaNombre
  );

  useEffect(() => {
    loadActividades();
  }, []);

  const loadActividades = async () => {
    try {
      const data = await getActividadesMateriasAdeudadas();
      setActividades(Array.isArray(data) ? data : []);
    } catch {
      setActividades([]);
    }
  };

  const actividadesMateria = useMemo(
    () =>
      actividades.filter((act) => String(act.id_curso_materia) === String(cursoMateriaId ?? '')),
    [actividades, cursoMateriaId],
  );

  const misCursoMateriaActiva = misAsignaciones.find(
    (cm) => String(cm.id) === String(cursoMateriaId),
  );

  const abrirModalNueva = () => {
    setEditingId(null);
    setArchivoActual(null);
    setModalCursoId(misCursoMateriaActiva ? String(misCursoMateriaActiva.id_curso) : '');
    setModalMateriaNombre(misCursoMateriaActiva ? misCursoMateriaActiva.materia_nombre : '');
    setTitulo('');
    setDescripcion('');
    setTipo('INTENSIFICACION');
    setPeriodoIntensificacion('Intensificación del primer cuatrimestre');
    setArchivo(null);
    setShowModal(true);
  };

  const abrirModalEditar = (act) => {
    const cm = misAsignaciones.find((c) => c.id === act.id_curso_materia);
    setEditingId(act.id_actividad);
    setArchivoActual(act.archivo_pdf || null);
    setModalCursoId(cm ? String(cm.id_curso) : '');
    setModalMateriaNombre(act.materia_nombre || '');
    setTitulo(act.titulo || '');
    setDescripcion(act.descripcion || '');
    setTipo(act.tipo || 'INTENSIFICACION');
    setPeriodoIntensificacion(act.periodo_intensificacion || 'Intensificación del primer cuatrimestre');
    setArchivo(null);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingId(null);
    setArchivoActual(null);
    setModalCursoId('');
    setModalMateriaNombre('');
    setTitulo('');
    setDescripcion('');
    setTipo('INTENSIFICACION');
    setPeriodoIntensificacion('Intensificación del primer cuatrimestre');
    setArchivo(null);
  };

  const handleGuardarActividad = async (e) => {
    e.preventDefault();
    if (!modalCursoMateriaObj) {
      toast.error('No se pudo identificar la materia asignada.');
      return;
    }
    if (!titulo) {
      toast.error('El título es obligatorio.');
      return;
    }
    if (tipo === 'INTENSIFICACION' && !periodoIntensificacion) {
      toast.error('El período de intensificación es obligatorio.');
      return;
    }

    setLoadingAct(true);
    try {
      let archivoUrl = archivoActual || '';
      if (archivo) {
        archivoUrl = (await uploadFile(archivo, 'materias_adeudadas')).url;
      }

      const payload = {
        id_curso_materia: modalCursoMateriaObj.id,
        id_docente: modalCursoMateriaObj.id_docente || misAsignaciones[0]?.id_docente,
        titulo,
        descripcion,
        archivo_pdf: archivoUrl,
        tipo,
        periodo_intensificacion: tipo === 'INTENSIFICACION' ? periodoIntensificacion : ''
      };

      if (editingId) {
        await updateActividadMateriaAdeudada(editingId, payload);
        toast.success('Actividad actualizada correctamente.');
      } else {
        await createActividadMateriaAdeudada(payload);
        toast.success('Actividad publicada correctamente.');
      }

      cerrarModal();
      loadActividades();
    } catch (err) {
      toast.error(
        editingId
          ? `Error al actualizar la actividad: ${mensajeError(err)}`
          : `Error al publicar la actividad: ${mensajeError(err)}`
      );
    } finally {
      setLoadingAct(false);
    }
  };

  const handleDeleteActividad = async (id) => {
    await confirmarEliminacion('¿Está seguro de eliminar esta actividad?', {
      onConfirm: async () => {
        try {
          await deleteActividadMateriaAdeudada(id);
          toast.success('Actividad eliminada correctamente.');
          loadActividades();
        } catch (err) {
          toast.error(`Error al eliminar la actividad: ${mensajeError(err)}`);
        }
      },
    });
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3><i className="fas fa-book-medical" aria-hidden="true" /> Materias Adeudadas e Intensificaciones</h3>
        <button
          type="button"
          className="btn btn-primary"
          onClick={abrirModalNueva}
        >
          <i className="fas fa-plus" aria-hidden="true" /> Nueva actividad
        </button>
      </div>
      <p className="text-muted" style={{ margin: '-10px 0 20px' }}>Gestión de actividades de intensificación y previas.</p>

      {showModal && (
        <FormModal title={editingId ? 'Editar actividad' : 'Nueva actividad'} onClose={cerrarModal}>
          <form onSubmit={handleGuardarActividad}>
            <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>

              <div className="form-group-filter">
                <label>Tipo de actividad</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal' }}>
                    <input
                      type="radio"
                      name="modal-tipo"
                      value="INTENSIFICACION"
                      checked={tipo === 'INTENSIFICACION'}
                      onChange={() => setTipo('INTENSIFICACION')}
                    /> Intensificación
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal' }}>
                    <input
                      type="radio"
                      name="modal-tipo"
                      value="PREVIA"
                      checked={tipo === 'PREVIA'}
                      onChange={() => setTipo('PREVIA')}
                    /> Previa
                  </label>
                </div>
              </div>

              {tipo === 'INTENSIFICACION' && (
                <div className="form-group-filter">
                  <label htmlFor="modal-periodo">Período de intensificación</label>
                  <select
                    id="modal-periodo"
                    className="form-control"
                    value={periodoIntensificacion}
                    onChange={(e) => setPeriodoIntensificacion(e.target.value)}
                    required
                  >
                    <option value="Intensificación del primer cuatrimestre">Intensificación del primer cuatrimestre</option>
                    <option value="Intensificación de diciembre">Intensificación de diciembre</option>
                    <option value="Intensificación de febrero/marzo">Intensificación de febrero/marzo</option>
                  </select>
                </div>
              )}

              <div className="form-group-filter">
                <label htmlFor="modal-titulo">Título de la actividad</label>
                <input
                  id="modal-titulo"
                  type="text"
                  className="form-control"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-filter">
                <label htmlFor="modal-desc">Descripción / Consignas</label>
                <textarea
                  id="modal-desc"
                  className="form-control"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              {editingId && archivoActual && (
                <div className="form-group-filter">
                  <label>PDF actual</label>
                  <a href={archivoActual} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                    <i className="fas fa-file-pdf" /> Ver PDF actual
                  </a>
                  <small className="text-muted"> Seleccioná un archivo nuevo solo si querés reemplazarlo.</small>
                </div>
              )}

              <div className="form-group-filter">
                <FilePicker
                  id="modal-pdf"
                  label="Archivo PDF (opcional)"
                  accept="application/pdf"
                  value={archivo ? [archivo] : []}
                  onChange={(files) => setArchivo(files[0] || null)}
                />
              </div>
            </div>

            <div className="standard-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cerrarModal}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loadingAct}>
                {loadingAct ? (editingId ? 'Actualizando...' : 'Publicando...') : (editingId ? 'Actualizar' : 'Publicar')}
              </button>
            </div>
          </form>
        </FormModal>
      )}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Curso / Materia</th>
              <th>Tipo</th>
              <th>Período</th>
              <th>Título</th>
              <th>Fecha</th>
              <th>Archivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividadesMateria.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state-message">No hay actividades publicadas para esta materia.</td>
              </tr>
            ) : (
              actividadesMateria.map((act) => (
                <tr key={act.id_actividad}>
                  <td><strong>{act.curso_nombre}</strong><br/>{act.materia_nombre}</td>
                  <td>
                    <span className={`badge ${act.tipo === 'PREVIA' ? 'badge-danger' : 'badge-warning'}`}>
                      {act.tipo === 'PREVIA' ? 'Previa' : 'Intensificación'}
                    </span>
                  </td>
                  <td>{act.tipo === 'INTENSIFICACION' ? (act.periodo_intensificacion || 'Intensificación del primer cuatrimestre') : '—'}</td>
                  <td><strong>{act.titulo}</strong><br/><small>{act.descripcion}</small></td>
                  <td>{act.fecha_publicacion ? new Date(act.fecha_publicacion).toLocaleDateString('es-AR') : '—'}</td>
                  <td>
                    {act.archivo_pdf ? (
                      <a href={act.archivo_pdf} target="_blank" rel="noopener noreferrer" className="btn btn-success table-download-btn">
                        <i className="fas fa-file-pdf" /> Ver PDF
                      </a>
                    ) : 'Sin archivo'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => abrirModalEditar(act)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteActividad(act.id_actividad)}
                    >
                      Eliminar
                    </button>
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

export default PanelMateriasAdeudadasDocente;