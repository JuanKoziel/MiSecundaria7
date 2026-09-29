import ToggleSwitch from './ToggleSwitch';

/**
 * Fila "Habilitado" del formulario de cuentas.
 *
 * Requisito del punto 6.3 / UI-1: el control de estado debe ser un toggle switch
 * accesible (role="switch"), alineado a la derecha del bloque y con la etiqueta
 * en el mismo eje vertical. Este componente es el patrón único para todos los
 * formularios (Docentes, Preceptores, Administradores, Tutores, etc.)
 * para no crear variantes múltiples.
 */
export default function FilaEstadoCuenta({
  id,
  etiqueta = 'Habilitado',
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <ToggleSwitch
      id={id}
      label={etiqueta}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
