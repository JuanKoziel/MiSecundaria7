function EmptyFiltros({ mensaje = 'Seleccioná año lectivo y curso para continuar.' }) {
  return (
    <div className="card empty-state-card">
      <p className="empty-state-message">{mensaje}</p>
    </div>
  );
}

export default EmptyFiltros;
