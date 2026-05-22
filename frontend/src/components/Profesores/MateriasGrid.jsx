function MateriasGrid({ materias, materiaSeleccionada, onSeleccionarMateria }) {
  return (
    <div className="materias-wrapper">
      <h3>Materias disponibles</h3>
      <div className="materias-grid">
        {materias.map((materia) => (
          <button
            key={materia}
            type="button"
            className={`materia-btn ${materiaSeleccionada === materia ? 'active-materia' : ''}`}
            onClick={() => onSeleccionarMateria(materia)}
          >
            {materia}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MateriasGrid;
