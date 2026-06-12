import { useMemo, useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { cursoConOrientacion } from '../../utils/orientacion';
import {
  createComunicado,
  createComunicadoArchivo,
  deleteComunicado,
  uploadFile,
} from '../../services/api';

const API_BASE = 'http://localhost:8000';

function Comunicados() {
  const {
    comunicados,
    cursos,
    cursosObj,
    materiasObj,
    materiasPorCurso,
    cursoMateria,
    refreshData,
  } = useData();
  const { user } = useAuth();

  const [form, setForm] = useState({ titulo: '', cuerpo: '', cursoId: '', materiaId: '' });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const filesRef = useRef(null);

  const [cursoFiltro, setCursoFiltro] = useState('');

  const materiasDelCurso = useMemo(() => {
    if (!form.cursoId) return [];
    const cursoSeleccionado = cursosObj.find((c) => c.id_curso === Number(form.cursoId));
    if (!cursoSeleccionado) return [];
    return materiasPorCurso[cursoSeleccionado.nombre_curso] || [];
  }, [form.cursoId, cursosObj, materiasPorCurso]);

  const listaFiltrada = useMemo(() => {
    const arr = cursoFiltro
      ? comunicados.filter((c) => c.curso === cursoFiltro)
      : comunicados;
    return [...arr].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [cursoFiltro, comunicados]);

  const handleGuardar = async () => {
    if (!form.titulo || !form.cuerpo || !form.cursoId) {
      setMensaje('Completá título, cuerpo y curso destino.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      const comunicado = await createComunicado({
        titulo: form.titulo,
        cuerpo: form.cuerpo,
        id_curso: Number(form.cursoId),
        id_materia: form.materiaId ? Number(form.materiaId) : null,
        fecha: new Date().toISOString(),
        id_usuario_creador: user?.id_usuario || user?.id || null,
      });
      
      const files = filesRef.current?.files;
      if (comunicado?.id_comunicado && files?.length) {
        for (const file of Array.from(files)) {
          try {
            const uploaded = await uploadFile(file, 'comunicados');
            await createComunicadoArchivo({
              id_comunicado: comunicado.id_comunicado,
              ruta_archivo: uploaded.url,
            });
          } catch (fileErr) {
            console.error('Error al subir archivo:', fileErr);
            setMensaje(`Comunicado creado pero hubo error al subir archivos: ${fileErr.message}`);
          }
        }
      }
      
      setMensaje('Comunicado enviado exitosamente.');
      setForm({ titulo: '', cuerpo: '', cursoId: '', materiaId: '' });
      if (filesRef.current) filesRef.current.value = '';
      
      // Refresh data to show the new comunicado
      await refreshData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error('Error al crear comunicado:', err);
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleBorrar = async (id) => {
    if (!window.confirm('¿Seguro que querés borrar este comunicado?')) return;
    setMensaje('');
    try {
      await deleteComunicado(id);
      setMensaje('Comunicado borrado.');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header-flex">
          <h3>Nuevo Comunicado</h3>
        </div>

        {mensaje && (
          <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
            {mensaje}
          </p>
        )}

        <div className="upload-dashed-box">
          <div className="preceptor-form-grid">
            <div className="form-group-filter preceptor-form-full">
              <label htmlFor="com-titulo">Título *</label>
              <input
                id="com-titulo"
                type="text"
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              />
            </div>
            <div className="form-group-filter preceptor-form-full">
              <label htmlFor="com-cuerpo">Cuerpo del comunicado *</label>
              <textarea
                id="com-cuerpo"
                rows={6}
                style={{ width: '100%', resize: 'vertical' }}
                value={form.cuerpo}
                onChange={(e) => setForm((p) => ({ ...p, cuerpo: e.target.value }))}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="com-curso">Curso destino *</label>
              <select
                id="com-curso"
                value={form.cursoId}
                onChange={(e) => setForm((p) => ({ ...p, cursoId: e.target.value }))}
              >
                <option value="">Seleccionar curso</option>
                {cursosObj.map((c) => (
                  <option key={c.id_curso} value={c.id_curso}>
                    {cursoConOrientacion(c.nombre_curso)}
                    {c.ciclo_anio ? ` (${c.ciclo_anio})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-filter">
              <label htmlFor="com-materia">Materia (opcional)</label>
              <select
                id="com-materia"
                value={form.materiaId}
                onChange={(e) => setForm((p) => ({ ...p, materiaId: e.target.value }))}
                disabled={!form.cursoId}
              >
                <option value="">Todo el curso</option>
                {materiasDelCurso.map((materiaNombre) => {
                  const materiaObj = materiasObj.find((m) => m.nombre_materia === materiaNombre);
                  return (
                    <option key={materiaObj?.id_materia || materiaNombre} value={materiaObj?.id_materia || ''}>
                      {materiaNombre}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="form-group-filter preceptor-form-full">
              <label htmlFor="com-files">Archivos adjuntos (opcional, uno o varios)</label>
              <input
                id="com-files"
                ref={filesRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.jpg,.png"
              />
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
            <i className="fas fa-paper-plane" aria-hidden="true" /> {guardando ? 'Enviando...' : 'Enviar comunicado'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header-flex">
          <h3>Comunicados enviados</h3>
        </div>

        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="com-filtro">Filtrar por curso</label>
            <select
              id="com-filtro"
              value={cursoFiltro}
              onChange={(e) => setCursoFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              {cursos.map((c) => (
                <option key={c} value={c}>{cursoConOrientacion(c)}</option>
              ))}
            </select>
          </div>
        </div>

        {listaFiltrada.length === 0 ? (
          <p className="empty-state-message" style={{ textAlign: 'center', padding: '24px' }}>
            No hay comunicados en este momento.
          </p>
        ) : (
          <div className="familia-comunicados-list">
            {listaFiltrada.map((c) => (
              <article key={c.id} className="familia-comunicado-item">
                <div className="familia-comunicado-meta">
                  <span className="badge role-badge-display">{c.fecha}</span>
                  <h4>{c.titulo}</h4>
                  <span className="empty-state-message">
                    {cursoConOrientacion(c.curso)}{c.materia ? ` · ${c.materia}` : ''}
                  </span>
                </div>
                <p>{c.cuerpo || c.descripcion}</p>
                {c.archivos?.length > 0 && (
                  <div className="comunicado-archivos">
                    {c.archivos.map((a) => (
                      <a
                        key={a.id}
                        href={`${API_BASE}${a.ruta_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success table-download-btn"
                      >
                        <i className="fas fa-paperclip" aria-hidden="true" /> Archivo
                      </a>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="btn-link-danger"
                  onClick={() => handleBorrar(c.id)}
                >
                  <i className="fas fa-trash" aria-hidden="true" /> Borrar
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Comunicados;
