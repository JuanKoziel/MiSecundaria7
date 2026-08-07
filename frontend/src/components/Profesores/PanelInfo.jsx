import { useState } from 'react';
import { createDiagnosticoGrupal } from '../../services/api';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

function PanelInfo({ cursoId, docenteId, cursoNombre, puedeEditar = true }) {
  const { refreshData } = useData();
  const toast = useToast();
  const [diagnostico, setDiagnostico] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleSubir = async () => {
    if (!diagnostico.trim()) {
      toast.warning('Escribí un diagnóstico antes de guardar.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    try {
      await createDiagnosticoGrupal({
        id_curso: cursoId,
        id_docente: docenteId,
        descripcion: diagnostico,
        fecha: new Date().toISOString().slice(0, 10),
      });
      toast.success('Diagnóstico guardado exitosamente.');
      setDiagnostico('');
      await refreshData();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message;
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Información y Diagnóstico General — {cursoNombre}</h3>
      </div>

      {!puedeEditar && (
        <p
          style={{
            background: '#fff4cf',
            borderLeft: '4px solid #d97706',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.9rem',
            color: '#854d0e',
            lineHeight: '1.6',
          }}
        >
          <i className="fas fa-lock" style={{ marginRight: '8px' }} aria-hidden="true" />
          El diagnóstico del grupo es de solo lectura mientras exista una suplencia activa en las materias de este curso.
        </p>
      )}

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
          {mensaje}
        </p>
      )}

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Informe de Diagnóstico de Grupo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <textarea
                  placeholder="Escriba aquí los detalles observados del comportamiento y rendimiento del grupo..."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  disabled={!puedeEditar}
                  style={{
                    width: '100%',
                    height: '110px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {puedeEditar && (
        <div className="action-footer-btn">
          <button type="button" className="btn btn-primary" onClick={handleSubir} disabled={guardando}>
            <i className="fas fa-upload" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar Diagnóstico'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PanelInfo;
