import { useState, useEffect } from 'react';
import PersonaSelector from './PersonaSelector';

function ModoCreacionPersona({ 
  personas, 
  formData, 
  setFormData, 
  editing, 
  label = '¿Cómo desea crear el perfil?',
  onPersonaChange 
}) {
  const [modo, setModo] = useState(() => {
    if (editing) return 'nuevo';
    return formData?.modo_creacion === 'existente' ? 'existente' : 'nuevo';
  });

  useEffect(() => {
    if (editing) {
      setModo('nuevo');
      setFormData((prev) => ({ ...prev, modo_creacion: 'nuevo', id_usuario_existente: '' }));
    }
  }, [editing, setFormData]);

  const handleModoChange = (nuevoModo) => {
    setModo(nuevoModo);
    setFormData((prev) => ({ ...prev, modo_creacion: nuevoModo, id_usuario_existente: '' }));
    if (onPersonaChange) onPersonaChange(nuevoModo, '');
  };

  const handlePersonaSelect = (id) => {
    const persona = (personas || []).find((p) => String(p.id_usuario || p.id) === String(id));
    if (persona) {
      setFormData((prev) => ({
        ...prev,
        id_usuario_existente: id,
        nombre: persona.nombre || '',
        apellido: persona.apellido || '',
        dni: persona.dni || '',
        correo: persona.correo || '',
        telefono: persona.telefono || '',
        usuario_nombre: persona.usuario || '',
        usuario: persona.usuario || '',
      }));
      if (onPersonaChange) onPersonaChange('existente', id);
    }
  };

  const isExisting = modo === 'existente';

  return (
    <section className="preceptor-form-section">
      <h4>{label}</h4>
      <div className="flex-row" style={{ gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer', 
          padding: '10px 14px', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          background: modo === 'existente' ? 'var(--primary-color)' : 'var(--card-bg)', 
          color: modo === 'existente' ? '#fff' : 'inherit',
          fontWeight: 500,
        }}>
          <input 
            type="radio" 
            name="modo_creacion" 
            value="existente" 
            checked={modo === 'existente'} 
            onChange={() => handleModoChange('existente')} 
          />
          <span>Persona existente</span>
        </label>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer', 
          padding: '10px 14px', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          background: modo === 'nuevo' ? 'var(--primary-color)' : 'var(--card-bg)', 
          color: modo === 'nuevo' ? '#fff' : 'inherit',
          fontWeight: 500,
        }}>
          <input 
            type="radio" 
            name="modo_creacion" 
            value="nuevo" 
            checked={modo === 'nuevo'} 
            onChange={() => handleModoChange('nuevo')} 
          />
          <span>Nueva persona</span>
        </label>
      </div>

      {modo === 'existente' && (
        <PersonaSelector
          personas={personas}
          value={formData?.id_usuario_existente}
          onChange={handlePersonaSelect}
          label="Persona existente"
          placeholder="Seleccione una persona..."
          required={!editing}
          disabled={!!editing}
        />
      )}

      {modo === 'existente' && formData?.id_usuario_existente && (
        <p className="m-0 mt-8" style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
          Se usará el usuario existente. Los datos personales se completarán automáticamente.
          {formData.correo && <> <br />Correo: {formData.correo}</>}
          {formData.telefono && <> <br />Teléfono: {formData.telefono}</>}
        </p>
      )}
    </section>
  );
}

export default ModoCreacionPersona;