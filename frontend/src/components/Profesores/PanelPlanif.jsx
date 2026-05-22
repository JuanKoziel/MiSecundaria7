function PanelPlanif() {
  const handleArchivo = () => {
    alert('Planificación seleccionada (modo demostración).');
  };

  return (
    <div className="card">
      <h3>Planificaciones Curriculares</h3>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
        Espacio de almacenamiento técnico-pedagógico para subir documentos metodológicos trimestrales o anuales.
      </p>

      <div className="upload-dashed-box">
        <label>
          <i className="fas fa-cloud-upload-alt cloud-icon" aria-hidden="true" />
          <strong>Seleccionar Planificación Educativa</strong>
          <span style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
            Formatos soportados: PDF, DOCX (Máx 10MB)
          </span>
          <input type="file" style={{ display: 'none' }} onChange={handleArchivo} />
        </label>
      </div>
    </div>
  );
}

export default PanelPlanif;
