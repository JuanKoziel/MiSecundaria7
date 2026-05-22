function CursoFilter({ cursos, value, onChange, id = 'curso-filter' }) {
  return (
    <div className="global-field-box">
      <div className="field-row">
        <div className="form-group-filter">
          <label htmlFor={id}>Curso</label>
          <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="" disabled>
              Seleccione un curso...
            </option>
            {cursos.map((curso) => (
              <option key={curso} value={curso}>
                {curso}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default CursoFilter;
