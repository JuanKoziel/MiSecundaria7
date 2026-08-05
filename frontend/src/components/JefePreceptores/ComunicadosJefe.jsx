import { useMemo, useRef, useState } from 'react';
import ComunicadosView from '../Shared/ComunicadosView';
import FormModal from '../Shared/FormModal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  createComunicado,
  createComunicadoArchivo,
  uploadFile,
} from '../../services/api';
import { parseCurso } from '../../utils/orientacion';
import { useToast } from '../../context/ToastContext';

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

function ComunicadosJefe() {
  const { user } = useAuth();
  const { cursosObj, ciclosLectivos, refreshData } = useData();
  const toast = useToast();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    cuerpo: '',
    cicloId: '',
    destinos: [],
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const filesRef = useRef(null);

  const ciclosMap = useMemo(() => {
    const map = new Map();
    (ciclosLectivos || []).forEach((c) => map.set(String(c.id_ciclo), c));
    return map;
  }, [ciclosLectivos]);

  const ciclosOrdenados = useMemo(
    () => [...(ciclosLectivos || [])].sort((a, b) => Number(b.anio) - Number(a.anio)),
    [ciclosLectivos],
  );

  const anioLectivoSeleccionado = form.cicloId
    ? String(ciclosMap.get(String(form.cicloId))?.anio || '')
    : '';

  const cursosDelCiclo = useMemo(
    () => (cursosObj || []).filter(
      (c) => String(c.ciclo_anio || '') === String(anioLectivoSeleccionado || ''),
    ),
    [cursosObj, anioLectivoSeleccionado],
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

  const toggleDestino = (destino) => {
    setForm((prev) => {
      const actual = Array.isArray(prev.destinos) ? prev.destinos : [];
      const key = getDestinoKey(destino);
      const exists = actual.some((item) => getDestinoKey(item) === key);
      return {
        ...prev,
        destinos: exists
          ? actual.filter((item) => getDestinoKey(item) !== key)
          : [...actual, destino],
      };
    });
  };

  const handleGuardar = async () => {
    if (!form.titulo || !form.cuerpo) {
      toast.warning('Completa título y cuerpo.');
      return;
    }
    if (!form.cicloId) {
      toast.warning('Seleccioná un año lectivo.');
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
        alcances: (Array.isArray(form.destinos) && form.destinos.length > 0)
          ? form.destinos.map((destino) => ({
            id_ciclo: destino.id_ciclo,
            curso: destino.curso,
            division: destino.division,
            id_materia: null,
          }))
          : [{ id_ciclo: Number(form.cicloId), curso: null, division: null, id_materia: null }],
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
      setForm({ titulo: '', cuerpo: '', cicloId: '', destinos: [] });
      if (filesRef.current) filesRef.current.value = '';
      await refreshData();
      setTimeout(() => {
        setMensaje('');
        setMostrarFormulario(false);
      }, 2000);
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const selectedDestinoLabels = useMemo(
    () => (Array.isArray(form.destinos) ? form.destinos : []).map((d) => getDestinoLabel(d)).join(', ') || 'General',
    [form.destinos],
  );

  return (
    <div>
      <div className="card">
        <div className="card-header-flex">
          <h3>Comunicados</h3>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            <i className={`fas ${mostrarFormulario ? 'fa-times' : 'fa-plus'}`} aria-hidden="true" />
            {' '}{mostrarFormulario ? 'Cancelar' : 'Nuevo Comunicado'}
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
                  <label htmlFor="jefe-com-titulo">Título *</label>
                  <input
                    id="jefe-com-titulo"
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                    placeholder="Escribe el título del comunicado"
                  />
                </div>

                <div className="form-group-filter preceptor-form-full">
                  <label htmlFor="jefe-com-cuerpo">Cuerpo del comunicado *</label>
                  <textarea
                    id="jefe-com-cuerpo"
                    rows={6}
                    value={form.cuerpo}
                    onChange={(e) => setForm((p) => ({ ...p, cuerpo: e.target.value }))}
                    placeholder="Escribe aquí el contenido del comunicado"
                  />
                </div>

                <div className="form-group-filter">
                  <label htmlFor="jefe-com-ciclo">Año lectivo *</label>
                  <select
                    id="jefe-com-ciclo"
                    value={form.cicloId}
                    onChange={(e) => setForm((p) => ({
                      ...p,
                      cicloId: e.target.value,
                      destinos: [],
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

                {destinosDisponibles.length > 0 && (
                  <div className="form-group-filter preceptor-form-full">
                    <label>Destinatarios (preceptores, docentes y familias)</label>
                    <div className="preceptor-cursos-multiselect">
                      {destinosDisponibles.map((destino) => {
                        const key = getDestinoKey(destino);
                        const checked = (Array.isArray(form.destinos) ? form.destinos : [])
                          .some((item) => getDestinoKey(item) === key);
                        return (
                          <label
                            key={key}
                            className={`preceptor-curso-option${checked ? ' preceptor-curso-option--selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDestino(destino)}
                            />
                            <span>{destino.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="preceptor-modo-hint">
                      Destino: <strong>{selectedDestinoLabels}</strong>
                    </p>
                  </div>
                )}

                <div className="form-group-filter preceptor-form-full">
                  <label htmlFor="jefe-com-archivos">Archivos adjuntos</label>
                  <input
                    id="jefe-com-archivos"
                    type="file"
                    ref={filesRef}
                    multiple
                  />
                </div>
              </div>

              <div className="info-box">
                <i className="fas fa-info-circle info-box-icon" aria-hidden="true" />
                El comunicado será visible para preceptores, docentes y familias de los cursos seleccionados.
              </div>
            </div>
            <div className="standard-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
                <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </FormModal>
        )}
      </div>

      <ComunicadosView userRole="jefe_preceptores" />
    </div>
  );
}

export default ComunicadosJefe;
