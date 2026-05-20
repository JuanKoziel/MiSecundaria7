import React from 'react';

function PanelInfo() {
  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Información y Diagnóstico General</h3>
      </div>
      
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Subir Actas del Curso</th>
              <th>Informe de Diagnóstico de Grupo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ width: '40%' }}>
                <input type="file" />
              </td>
              <td>
                <textarea 
                  placeholder="Escriba aquí los detalles observados del comportamiento y rendimiento del grupo..."
                  style={{ 
                    width: '100%', 
                    height: '110px', 
                    padding: '12px', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="action-footer-btn">
        <button className="btn btn-primary">
          <i className="fas fa-upload"></i> Subir Datos
        </button>
      </div>
    </div>
  );
}

export default PanelInfo;