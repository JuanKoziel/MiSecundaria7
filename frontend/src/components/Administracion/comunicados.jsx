import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  createComunicado,
  createComunicadoArchivo,
  deleteComunicado,
  uploadFile,
} from '../../services/api';
import { cursoConOrientacion, parseCurso } from '../../utils/orientacion';
import { findCursoObj, getAniosCurso, getDivisiones } from './cursoFilters';

const API_BASE = 'http://localhost:8000';

function Comunicados() {
  const {
    comunicados,
    cursosObj,
    ciclosLectivos,
    materiasObj,
    materiasPorCurso,
    refreshData,
  } = useData();
  const { user } = useAuth();

  const [form, setForm] = useState({
    titulo: '',
    cuerpo: '',
    cicloId: '',
    anioCurso: '',
    division: '',
    materiaId: '',
  });
  const [filtro, setFiltro] = useState({
    cicloId: '',
    anioCurso: '',
    division: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const filesRef = useRef(null);

  const ciclosMap = useMemo(() => {
    const map = new Map();
    (ciclosLectivos || []).forEach((c) => {
      map.set(String(c.id_ciclo), c);
    });
    return map;
  }, [ciclosLectivos]);

  const ciclosOrdenados = useMemo(
    () => [...(ciclosLectivos || [])].sort((a, b) => Number(b.anio) - Number(a.anio)),
    [ciclosLectivos],
  );

  const anioLectivoSeleccionado = form.cicloId ? String(ciclosMap.get(String(form.cicloId))?.anio || '') : '';
  const anioLectivoFiltro = filtro.cicloId ? String(ciclosMap.get(String(filtro.cicloId))?.anio || '') : '';

  const aniosCurso = useMemo(
    () => getAniosCurso(cursosObj, anioLectivoSeleccionado),
    [cursosObj, anioLectivoSeleccionado],
  );
  const divisiones = useMemo(
    () => getDivisiones(cursosObj, anioLectivoSeleccionado, form.anioCurso),
    [cursosObj, anioLectivoSeleccionado, form.anioCurso],
  );

  const cursoExacto = useMemo(
    () => findCursoObj(cursosObj, anioLectivoSeleccionado, form.anioCurso, form.division),
    [cursosObj, anioLectivoSeleccionado, form.anioCurso, form.division],
  );

  const materiasDelCurso = useMemo(() => {
    if (!cursoExacto?.nombre_curso) return [];
    return materiasPorCurso[cursoExacto.nombre_curso] || [];
  }, [cursoExacto, materiasPorCurso]);

  const alcancePreview = useMemo(() => {
    if (!form.cicloId && !form.anioCurso && !form.division && !form.materiaId) return 'Comunicado general';
    if (form.cicloId && !form.anioCurso) return `Ciclo lectivo ${anioLectivoSeleccionado}`;
    if (!form.anioCurso) return `Ciclo lectivo ${anioLectivoSeleccionado}`;
    if (!form.division) return `Ciclo lectivo ${anioLectivoSeleccionado} · ${form.anioCurso}°`;
    const base = `Ciclo lectivo ${anioLectivoSeleccionado} · ${form.anioCurso}°${form.division}`;
    if (!form.materiaId) return base;
    const materia = materiasObj.find((m) => String(m.id_materia) === String(form.materiaId));
    return `${base} · ${materia?.nombre_materia || 'Materia'}`;
  }, [form.cicloId, form.anioCurso, form.division, form.materiaId, anioLectivoSeleccionado, materiasObj]);

  const listaFiltrada = useMemo(() => {
    const arr = (Array.isArray(comunicados) ? comunicados : []).filter((c) => {
      if (filtro.cicloId && String(c.anio_lectivo || '') !== String(ciclosMap.get(String(filtro.cicloId))?.anio || '')) {
        return false;
      }
      if (filtro.anioCurso || filtro.division) {
        const { anio, division } = parseCurso(c.curso || '');
        if (filtro.anioCurso && String(anio || '') !== String(filtro.anioCurso)) return false;
        if (filtro.division && !['general', 'year', 'course'].includes(c.scope || '')) {
          if (String(division || '') !== String(filtro.division)) return false;
        }
      }
      return true;
    });
    return [...arr].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [filtro, comunicados]);

  const handleGuardar = async () => {
    if (!form.titulo || !form.cuerpo) {
      setMensaje('Completa título y cuerpo.');
      return;
    }

    if (form.materiaId && (!form.cicloId || !form.anioCurso || !form.division)) {
      setMensaje('La materia solo puede seleccionarse con año y división completos.');
      return;
    }

    setGuardando(true);
    setMensaje('');

    try {
      const comunicado = await createComunicado({
        titulo: form.titulo,
        cuerpo: form.cuerpo,
        fecha: new Date().toISOString(),
        id_usuario_creador: user?.id_usuario || user?.id || null,
        id_curso: cursoExacto?.id_curso ? Number(cursoExacto.id_curso) : null,
        id_materia: form.materiaId ? Number(form.materiaId) : null,
        alcance: {
          id_ciclo: form.cicloId ? Number(form.cicloId) : null,
          curso: form.anioCurso ? Number(form.anioCurso) : null,
          division: form.division ? Number(form.division) : null,
        },
      });

      const files = filesRef.current?.files ? Array.from(filesRef.current.files) : [];
      if (comunicado?.id_comunicado && files.length > 0) {
        for (const file of files) {
          const uploaded = await uploadFile(file, 'comunicados');
          await createComunicadoArchivo({
            id_comunicado: comunicado.id_comunicado,
            ruta_archivo: uploaded.url,
          });
        }
      }

      setMensaje('Comunicado enviado exitosamente.');
      setForm({
        titulo: '',
        cuerpo: '',
        cicloId: '',
        anioCurso: '',
        division: '',
        materiaId: '',
      });
      if (filesRef.current) filesRef.current.value = '';
      await refreshData();
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
    if (!window.confirm('¿Estás seguro de borrar este comunicado?')) return;
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

        <div className="table-responsive upload-dashed-box comunicados-form">
          <div className="preceptor-form-grid">
            <div className="form-group-filter preceptor-form-full">
              <label htmlFor="com-titulo">Título *</label>
              <input
                id="com-titulo"
                type="text"
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Escribe el título del comunicado"
              />
            </div>

            <div className="form-group-filter preceptor-form-full">
              <label htmlFor="com-cuerpo">Cuerpo del comunicado *</label>
              <textarea
                id="com-cuerpo"
                rows={8}
                value={form.cuerpo}
                onChange={(e) => setForm((p) => ({ ...p, cuerpo: e.target.value }))}
                placeholder="Escribe aquí el contenido del comunicado"
              />
            </div>

            <div className="form-group-filter">
              <label htmlFor="com-ciclo">Año lectivo *</label>
              <select
                id="com-ciclo"
                value={form.cicloId}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  cicloId: e.target.value,
                  anioCurso: '',
                  division: '',
                  materiaId: '',
                }))}
              >
                <option value="">Seleccionar...</option>
                {ciclosOrdenados.map((ciclo) => (
                  <option key={ciclo.id_ciclo} value={ciclo.id_ciclo}>
                    {ciclo.anio}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-filter">
              <label htmlFor="com-anio-curso">Año</label>
              <select
                id="com-anio-curso"
                value={form.anioCurso}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  anioCurso: e.target.value,
                  division: '',
                  materiaId: '',
                }))}
                disabled={!form.cicloId}
              >
                <option value="">Todo el año</option>
                {aniosCurso.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}°
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-filter">
              <label htmlFor="com-division">División</label>
              <select
                id="com-division"
                value={form.division}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  division: e.target.value,
                  materiaId: '',
                }))}
                disabled={!form.anioCurso}
              >
                <option value="">Toda la división</option>
                {divisiones.map((div) => (
                  <option key={div} value={div}>
                    {div}
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
                disabled={!form.division}
              >
                <option value="">Sin materia</option>
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
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
              />
            </div>

            <div className="form-group-filter preceptor-form-full">
              <label>Destino previsto</label>
              <div className="comunicados-destino-preview">{alcancePreview}</div>
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
            <label htmlFor="filtro-ciclo">Año lectivo</label>
            <select
              id="filtro-ciclo"
              value={filtro.cicloId}
              onChange={(e) => setFiltro((p) => ({
                ...p,
                cicloId: e.target.value,
                anioCurso: '',
                division: '',
              }))}
            >
              <option value="">Todos</option>
              {ciclosOrdenados.map((ciclo) => (
                <option key={ciclo.id_ciclo} value={ciclo.id_ciclo}>
                  {ciclo.anio}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="filtro-anio-curso">Año</label>
            <select
              id="filtro-anio-curso"
              value={filtro.anioCurso}
              onChange={(e) => setFiltro((p) => ({
                ...p,
                anioCurso: e.target.value,
                division: '',
              }))}
              disabled={!filtro.cicloId}
            >
              <option value="">Todos</option>
              {getAniosCurso(cursosObj, anioLectivoFiltro).map((anio) => (
                <option key={anio} value={anio}>
                  {anio}°
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-filter">
            <label htmlFor="filtro-division">División</label>
            <select
              id="filtro-division"
              value={filtro.division}
              onChange={(e) => setFiltro((p) => ({ ...p, division: e.target.value }))}
              disabled={!filtro.anioCurso}
            >
              <option value="">Todas</option>
              {getDivisiones(cursosObj, anioLectivoFiltro, filtro.anioCurso).map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
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
              <article key={c.id || c.id_comunicado} className="familia-comunicado-item">
                <div className="familia-comunicado-meta">
                  <span className="badge role-badge-display">
                    {c.fecha ? new Date(c.fecha).toLocaleString('es-AR') : 'Sin fecha'}
                  </span>
                  <h4>{c.titulo}</h4>
                  <span className="empty-state-message">
                    {c.alcance_label || cursoConOrientacion(c.curso) || c.curso}
                    {c.materia ? ` · ${c.materia}` : ''}
                  </span>
                  <span className="empty-state-message">
                    Creador: {c.creador_nombre || `Usuario #${c.id_usuario_creador || '—'}`}
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
                  onClick={() => handleBorrar(c.id || c.id_comunicado)}
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
