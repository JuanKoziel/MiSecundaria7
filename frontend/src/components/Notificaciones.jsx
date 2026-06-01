function Notificaciones() {
  return (
    <div className="card">
      <div className="card-header-flex">
        <h3>Notificaciones</h3>
      </div>
      <div className="notificaciones-empty">
        <i className="fas fa-bell-slash" aria-hidden="true" />
        <p>No hay notificaciones disponibles.</p>
      </div>
    </div>
  );
}

export default Notificaciones;
