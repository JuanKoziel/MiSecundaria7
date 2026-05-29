function PanelPlanif() {
  const handleArchivo = () => {
    alert('Planificación seleccionada (modo demostración).');
  };

  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Planificaciones Curriculares</h3>
      </div>
      <p className="card-description">
        Espacio de almacenamiento técnico-pedagógico para subir documentos metodológicos trimestrales o anuales.
      </p>

      <div className="upload-dashed-box">
        <label>
          <i className="fas fa-cloud-upload-alt cloud-icon" aria-hidden="true" />
          <strong>Seleccionar Planificación Educativa</strong>
          <span className="upload-hint">
            Formatos soportados: PDF, DOCX (Máx 10MB)
          </span>
          <input type="file" style={{ display: 'none' }} onChange={handleArchivo} />
        </label>
      </div>
    </div>
  );
}

export default PanelPlanif;
