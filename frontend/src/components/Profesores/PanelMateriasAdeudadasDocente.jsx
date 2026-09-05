import { useState, useEffect, useMemo } from 'react';
import {
  getActividadesMateriasAdeudadas,
  createActividadMateriaAdeudada,
  updateActividadMateriaAdeudada,
  deleteActividadMateriaAdeudada,
  uploadFile
} from '../../services/api';
import FormModal from '../Shared/FormModal';
import confirmarEliminacion from '../../utils/confirmarEliminacion';
import { useToast } from '../../context/ToastContext';

function mensajeError(err) {
  const data = err.response?.data;
  if (data && typeof data === 'object' && !data.detail) {
    return Object.values(data).flat().join(' | ');
  }
  return data?.detail || err.message || 'Error inesperado';
}

function PanelMateriasAdeudadasDocente({ misAsignaciones, misCursos, cursosObj }) {
  const [cursoId, setCursoId] = useState('');
  const [materiaNombre, setMateriaNombre] = useState('');
  const toast = useToast();

  // Intensificaciones state
  const [actividades, setActividades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalCursoId, setModalCursoId] = useState('');
  const [modalMateriaNombre, setModalMateriaNombre] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [periodoIntensificacion, setPeriodoIntensificacion] = useState('Intensificación del primer cuatrimestre');
  const [archivo, setArchivo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [archivoActual, setArchivoActual] = useState(null);
  const [loadingAct, setLoadingAct] = useState(false);

  const cursoMateriaObj = misAsignaciones.find(
    (cm) => String(cm.id_curso) === String(cursoId) && cm.materia_nombre === materiaNombre
  );

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

  const misCursosOrdenados = useMemo(
    () => [...(cursosObj || [])].sort((a, b) => {
      const cicloA = a.ciclo_anio || 0;
      const cicloB = b.ciclo_anio || 0;
      if (cicloA !== cicloB) return cicloB - cicloA;
      return String(a.nombre_curso).localeCompare(String(b.nombre_curso));
    }),
    [cursosObj],
  );

  const modalMateriasFiltradas = misAsignaciones
    .filter((cm) => String(cm.id_curso) === String(modalCursoId))
    .map((cm) => cm.materia_nombre);

  const materiasFiltradas = misAsignaciones
    .filter((cm) => String(cm.id_curso) === String(cursoId))
    .map((cm) => cm.materia_nombre);

  const actividadesVisibles = cursoMateriaObj
    ? actividades.filter((a) => a.id_curso_materia === cursoMateriaObj.id)
    : actividades;

  const abrirModalNueva = () => {
    setEditingId(null);
    setArchivoActual(null);
    setModalCursoId('');
    setModalMateriaNombre('');
    setTitulo('');
    setDescripcion('');
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
    setPeriodoIntensificacion('Intensificación del primer cuatrimestre');
    setArchivo(null);
  };

  const handleGuardarActividad = async (e) => {
    e.preventDefault();
    if (!modalCursoMateriaObj) {
      toast.error('Debe seleccionar un curso y materia válidos.');
      return;
    }
    if (!titulo || !periodoIntensificacion) {
      toast.error('Curso, materia, período y título son obligatorios.');
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
        tipo: 'INTENSIFICACION',
        periodo_intensificacion
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
      <h2>Materias Adeudadas e Intensificaciones</h2>
      <p className="text-muted">Gestión de actividades de intensificación.</p>

      <div className="flex-row--end mb-16">
        <button
          type="button"
          className="btn btn-primary"
          onClick={abrirModalNueva}
        >
          <i className="fas fa-plus" aria-hidden="true" /> Nueva intensificación
        </button>
      </div>

      <div className="filter-row mb-16">
        <div className="form-group-filter">
          <label>Filtrar por Curso</label>
          <select value={cursoId} onChange={(e) => { setCursoId(e.target.value); setMateriaNombre(''); }}>
            <option value="">Seleccione curso...</option>
            {misCursosOrdenados.map((c) => (
              <option key={c.id_curso} value={String(c.id_curso)}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {cursoId && (
          <div className="form-group-filter">
            <label>Filtrar por Materia</label>
            <select value={materiaNombre} onChange={(e) => setMateriaNombre(e.target.value)}>
              <option value="">Todas las materias</option>
              {materiasFiltradas.map((mat, idx) => (
                <option key={idx} value={mat}>{mat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {showModal && (
        <FormModal title={editingId ? 'Editar intensificación' : 'Nueva intensificación'} onClose={cerrarModal}>
          <form onSubmit={handleGuardarActividad}>
            <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>

              <div className="preceptor-form-row preceptor-form-row--two">
                <div className="form-group-filter">
                  <label htmlFor="modal-curso">Curso</label>
                  <select
                    id="modal-curso"
                    className="form-control"
                    value={modalCursoId}
                    onChange={(e) => { setModalCursoId(e.target.value); setModalMateriaNombre(''); }}
                    required
                  >
                    <option value="">Seleccione curso...</option>
                    {misCursosOrdenados.map((c) => (
                      <option key={c.id_curso} value={String(c.id_curso)}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-filter">
                  <label htmlFor="modal-materia">Materia</label>
                  <select
                    id="modal-materia"
                    className="form-control"
                    value={modalMateriaNombre}
                    onChange={(e) => setModalMateriaNombre(e.target.value)}
                    required
                    disabled={!modalCursoId}
                  >
                    <option value="">Seleccione materia...</option>
                    {modalMateriasFiltradas.map((mat, idx) => (
                      <option key={idx} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
              </div>

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
                <label htmlFor="modal-pdf">Archivo PDF (opcional)</label>
                <input
                  id="modal-pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setArchivo(e.target.files[0])}
                />
                <small className="text-muted">Opcional. Podés publicar la actividad sin adjuntar archivo.</small>
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
              <th>Período</th>
              <th>Título</th>
              <th>Fecha</th>
              <th>Archivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividadesVisibles.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state-message">No hay actividades de intensificación publicadas.</td>
              </tr>
            ) : (
              actividadesVisibles.map((act) => (
                <tr key={act.id_actividad}>
                  <td><strong>{act.curso_nombre}</strong><br/>{act.materia_nombre}</td>
                  <td><span className="badge badge-warning">{act.periodo_intensificacion || 'Intensificación del primer cuatrimestre'}</span></td>
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