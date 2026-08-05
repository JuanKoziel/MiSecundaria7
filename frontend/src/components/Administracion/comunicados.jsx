import { useMemo, useRef, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import FormModal from '../../components/Shared/FormModal';
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
import confirmarEliminacion from '../../utils/confirmarEliminacion';

const API_BASE = 'http://localhost:8000';

function getDestinoKey(destino) {
  if (!destino) return '';
  if (destino.key) return destino.key;
  return `${destino.tipo || 'destino'}-${destino.id_ciclo ?? ''}-${destino.curso ?? ''}-${destino.division ?? ''}`;
}

function getDestinoLabel(destino) {
  if (!destino) return 'General';
  if (destino.tipo === 'general') return 'General';
  if (destino.tipo === 'year') return `${destino.curso}°`;
  if (destino.tipo === 'division') return `${destino.curso}°${destino.division}`;
  return 'General';
}

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
  const toast = useToast();

  const [form, setForm] = useState({
    titulo: '',
    cuerpo: '',
    cicloId: '',
    destinos: [],
    materiaId: '',
  });
  const [filtro, setFiltro] = useState({
    cicloId: '',
    anioCurso: '',
    division: '',
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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

  const cursosDelCiclo = useMemo(
    () => (cursosObj || []).filter((curso) => String(curso.ciclo_anio || '') === String(anioLectivoSeleccionado || '')),
    [cursosObj, anioLectivoSeleccionado],
  );

  const cursoExacto = useMemo(() => {
    if (!form.destinos.length) return null;
    if (form.destinos.length !== 1) return null;
    const destino = form.destinos[0];
    if (destino.tipo !== 'division') return null;
    return findCursoObj(cursosObj, anioLectivoSeleccionado, String(destino.curso), String(destino.division));
  }, [cursosObj, anioLectivoSeleccionado, form.destinos]);

  const materiasDelCurso = useMemo(() => {
    if (!cursoExacto?.nombre_curso) return [];
    return materiasPorCurso[cursoExacto.nombre_curso] || [];
  }, [cursoExacto, materiasPorCurso]);

  const destinosSeleccionados = useMemo(
    () => (Array.isArray(form.destinos) ? form.destinos : []),
    [form.destinos],
  );

  const destinosDisponibles = useMemo(() => {
    if (!anioLectivoSeleccionado) return [];
    const disponibles = [];
    const years = new Set();
    (cursosDelCiclo || []).forEach((curso) => {
      const parts = parseCurso(curso.nombre_curso || '');
      if (!parts.anio) return;
      if (!years.has(parts.anio)) {
        years.add(parts.anio);
        disponibles.push({
          tipo: 'year',
          id_ciclo: Number(form.cicloId),
          curso: parts.anio,
          division: null,
          label: `${parts.anio}°`,
          key: `year-${form.cicloId}-${parts.anio}`,
        });
      }
      if (parts.division) {
        disponibles.push({
          tipo: 'division',
          id_ciclo: Number(form.cicloId),
          curso: parts.anio,
          division: parts.division,
          label: `${parts.anio}°${parts.division}`,
          key: `division-${form.cicloId}-${parts.anio}-${parts.division}`,
        });
      }
    });
    return disponibles;
  }, [cursosDelCiclo, anioLectivoSeleccionado, form.cicloId]);

  const selectedDestinoLabels = useMemo(
    () => destinosSeleccionados.map((destino) => getDestinoLabel(destino)).join(', ') || 'General',
    [destinosSeleccionados],
  );

  const toggleDestino = (destino) => {
    setForm((prev) => {
      const actual = Array.isArray(prev.destinos) ? prev.destinos : [];
      const key = getDestinoKey(destino);
      const exists = actual.some((item) => getDestinoKey(item) === key);
      const destinos = exists
        ? actual.filter((item) => getDestinoKey(item) !== key)
        : [...actual, destino];
      return { ...prev, destinos };
    });
  };

  const listaFiltrada = useMemo(() => {
    const arr = (Array.isArray(comunicados) ? comunicados : []).filter((c) => {
      const alcances = Array.isArray(c.alcances) ? c.alcances : [];
      const matchAlcance = (a) => {
        if (filtro.cicloId && String(a.id_ciclo || '') !== String(filtro.cicloId)) return false;
        if (filtro.anioCurso && a.curso !== null && a.curso !== undefined && String(a.curso) !== String(filtro.anioCurso)) return false;
        if (filtro.division && a.division !== null && a.division !== undefined && String(a.division) !== String(filtro.division)) return false;
        return true;
      };
      if (filtro.cicloId || filtro.anioCurso || filtro.division) {
        return alcances.some((a) => matchAlcance(a));
      }
      return true;
    });
    return [...arr].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [filtro, comunicados]);

  const handleGuardar = async () => {
    if (!form.titulo || !form.cuerpo) {
      toast.warning('Completa título y cuerpo.');
      return;
    }

    if (form.materiaId && (destinosSeleccionados.length !== 1 || destinosSeleccionados[0]?.tipo !== 'division')) {
      toast.warning('La materia solo puede seleccionarse para un destino con división específica.');
      return;
    }

    if (!form.cicloId) {
      toast.info('Selecciona un año lectivo.');
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
        id_curso: null,
        id_materia: null,
        alcances: destinosSeleccionados.map((destino) => ({
          id_ciclo: destino.id_ciclo,
          curso: destino.curso,
          division: destino.division,
          id_materia: form.materiaId ? Number(form.materiaId) : null,
        })),
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

      toast.success('Comunicado publicado correctamente.');
      setForm({
        titulo: '',
        cuerpo: '',
        cicloId: '',
        destinos: [],
        materiaId: '',
      });
      if (filesRef.current) filesRef.current.value = '';
      await refreshData();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error('Error al crear comunicado:', err);
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      toast.error(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleBorrar = async (id) => {
    if (!confirmarEliminacion()) return;
    setMensaje('');
    try {
      await deleteComunicado(id);
      toast.success('Comunicado eliminado correctamente.');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      toast.error(`Error: ${msg}`);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header-flex">
          <h3>Nuevo Comunicado</h3>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setMostrarFormulario(!mostrarFormulario)}>
            <i className={`fas ${mostrarFormulario ? 'fa-times' : 'fa-plus'}`} aria-hidden="true" />
            {mostrarFormulario ? 'Cancelar' : 'Nuevo comunicado'}
          </button>
        </div>

        {mostrarFormulario && (
          <FormModal title="Nuevo Comunicado" onClose={() => setMostrarFormulario(false)}>
            {mensaje && (
              <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
                {mensaje}
              </p>
            )}
            <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
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
                      destinos: [],
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

                <div className="form-group-filter preceptor-form-full">
                  <div className="preceptor-cursos-header">
                    <h4 id="com-destinos-label">Destinos académicos</h4>
                    <span className="badge badge-neutral">
                      {destinosSeleccionados.length} seleccionados
                    </span>
                  </div>
                  <div className="preceptor-cursos-multiselect" role="group" aria-labelledby="com-destinos-label">
                    {destinosDisponibles.length === 0 ? (
                      <p className="empty-state-message">
                        {anioLectivoSeleccionado
                          ? 'No hay cursos disponibles para el año lectivo seleccionado.'
                          : 'Seleccioná un año lectivo para ver los cursos disponibles.'}
                      </p>
                    ) : (
                      destinosDisponibles.map((destino) => {
                        const checked = destinosSeleccionados.some((item) => getDestinoKey(item) === destino.key);
                        return (
                          <label
                            key={destino.key}
                            className={`preceptor-curso-option${checked ? ' preceptor-curso-option--selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleDestino(destino)}
                            />
                            <span>{destino.label}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="form-group-filter">
                  <label htmlFor="com-materia">Materia (opcional)</label>
                  <select
                    id="com-materia"
                    value={form.materiaId}
                    onChange={(e) => setForm((p) => ({ ...p, materiaId: e.target.value }))}
                    disabled={!cursoExacto}
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
                  <div className="comunicados-destino-preview">{selectedDestinoLabels}</div>
                </div>
              </div>
            </div>
            <div className="standard-modal-footer">
              <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
                <i className="fas fa-paper-plane" aria-hidden="true" /> {guardando ? 'Enviando...' : 'Enviar comunicado'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
            </div>
          </FormModal>
        )}
      </div>

      <div className="card mt-20">
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
          <p className="empty-state-message empty-state-centered">
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
    </div>
  );
}

export default Comunicados;
