import { useState, useEffect } from 'react';
import { uploadFile, createPlanificacion, getPlanificaciones } from '../../services/api';
import { useData } from '../../context/DataContext';

const API_BASE = 'http://localhost:8000';

function PanelPlanif({ cursoMateriaId, docenteId, materiaNombre, cursoNombre }) {
  const { refreshData } = useData();
  const [planifs, setPlanifs] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!cursoMateriaId) return;
    getPlanificaciones({ curso_materia: cursoMateriaId })
      .then((data) => setPlanifs(Array.isArray(data) ? data : data.results || []))
      .catch(() => {});
  }, [cursoMateriaId]);

  const handleArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    setMensaje('');
    try {
      const uploaded = await uploadFile(file, 'planificaciones');
      await createPlanificacion({
        id_docente: docenteId,
        id_curso_materia: cursoMateriaId,
        titulo: file.name,
        ruta_archivo: uploaded.url,
        fecha_subida: new Date().toISOString(),
      });
      setMensaje('Planificación subida exitosamente.');
      const fresh = await getPlanificaciones({ curso_materia: cursoMateriaId });
      setPlanifs(Array.isArray(fresh) ? fresh : fresh.results || []);
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      setMensaje(`Error: ${msg}`);
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planificaciones — {materiaNombre} ({cursoNombre})</h3>
      </div>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      {planifs.length > 0 && (
        <div className="table-responsive" style={{ marginBottom: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Fecha de subida</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {planifs.map((p) => (
                <tr key={p.id_planificacion}>
                  <td className="table-cell-strong">{p.titulo || 'Sin título'}</td>
                  <td>{p.fecha_subida ? new Date(p.fecha_subida).toLocaleDateString() : '—'}</td>
                  <td>
                    {p.ruta_archivo ? (
                      <a
                        href={`${API_BASE}${p.ruta_archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success table-download-btn"
                      >
                        <i className="fas fa-download" aria-hidden="true" /> Descargar
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="upload-dashed-box">
        <label>
          <i className="fas fa-cloud-upload-alt cloud-icon" aria-hidden="true" />
          <strong>{subiendo ? 'Subiendo...' : 'Seleccionar Planificación Educativa'}</strong>
          <span className="upload-hint">
            Formatos soportados: PDF, DOCX (Máx 10MB)
          </span>
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            style={{ display: 'none' }}
            onChange={handleArchivo}
            disabled={subiendo}
          />
        </label>
      </div>
    </div>
  );
}

export default PanelPlanif;
