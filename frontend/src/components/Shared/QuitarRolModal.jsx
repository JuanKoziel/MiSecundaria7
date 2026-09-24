import { useEffect, useMemo, useState } from 'react';
import FormModal from './FormModal';

function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function QuitarRolModal({ titulo, subtitulo, personas, onClose, onQuitar, quitando, mensaje }) {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState('');

  useEffect(() => {
    setBusqueda('');
    setSeleccionada('');
  }, []);

  const personasElegibles = useMemo(
    () => (personas || []).filter((p) => Number(p.cantidad_roles) > 1),
    [personas],
  );

  const filtradas = useMemo(() => {
    const q = normalize(busqueda.trim());
    if (!q) return personasElegibles;
    return personasElegibles.filter(
      (p) =>
        normalize(p.apellido).includes(q) ||
        normalize(p.nombre).includes(q) ||
        normalize(`${p.apellido} ${p.nombre}`).includes(q) ||
        normalize(`${p.nombre} ${p.apellido}`).includes(q),
    );
  }, [personasElegibles, busqueda]);

  const personaSel = personasElegibles.find(
    (p) => String(p.id_usuario ?? p.id) === String(seleccionada),
  );

  return (
    <FormModal title={titulo} onClose={onClose}>
      <div className="standard-modal-body" style={{ display: 'grid', gap: '14px' }}>
        {subtitulo && (
          <p className="m-0" style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
            {subtitulo}
          </p>
        )}
        <p className="m-0" style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
          Solo se muestran personas con al menos dos roles asignados: se conservará al menos un rol.
        </p>
        {mensaje && (
          <p className="m-0" style={{ color: mensaje.startsWith('Error') ? 'red' : 'green' }}>
            {mensaje}
          </p>
        )}
        <div className="form-group-filter">
          <label htmlFor="quitar-rol-busqueda">Buscar persona</label>
          <input
            id="quitar-rol-busqueda"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o apellido..."
            autoFocus
          />
        </div>
        <div
          style={{
            maxHeight: 280,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        >
          {filtradas.length === 0 ? (
            <p className="empty-state-message m-0" style={{ padding: '16px', margin: 0 }}>
              No se encontraron personas con al menos dos roles.
            </p>
          ) : (
            filtradas.map((p) => {
              const idPersona = p.id_usuario ?? p.id;
              const activa = String(seleccionada) === String(idPersona);
              return (
                <label
                  key={idPersona}
                  className={`preceptor-curso-option${activa ? ' preceptor-curso-option--selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    name="quitar-rol-persona"
                    value={String(idPersona)}
                    checked={activa}
                    onChange={() => setSeleccionada(String(idPersona))}
                  />
                  <span>
                    {p.apellido}, {p.nombre}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
      <div className="standard-modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={!personaSel || quitando}
          onClick={() => personaSel && onQuitar(personaSel)}
        >
          <i className="fas fa-user-minus" aria-hidden="true" /> {quitando ? 'Quitando...' : 'Quitar rol'}
        </button>
      </div>
    </FormModal>
  );
}

export default QuitarRolModal;