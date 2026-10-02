import { useEffect, useRef, useState } from 'react';
import { soloNumeros, validarNumero, formatearNumero } from '../../utils/numericValidation';

export default function NumericInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  min,
  max,
  enteros = true,
  placeholder,
  className = '',
  inputMode = 'numeric',
  type = 'text',
  ...rest
}) {
  const [valorLocal, setValorLocal] = useState(() => formatearNumero(value));
  const [touched, setTouched] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState(null);

  // `valorLocal` se sembraba una sola vez, así que si el padre reseteaba el
  // formulario (cerrar y reabrir un modal) el input seguía mostrando el valor
  // anterior. Se resincroniza solo cuando el valor externo cambia de verdad: cada
  // tecla se re-eco desde el padre, y comparar contra el último externo evita
  // pisar lo que el usuario está escribiendo.
  const valorExterno = formatearNumero(value);
  const ultimoExternoRef = useRef(valorExterno);

  useEffect(() => {
    if (ultimoExternoRef.current === valorExterno) return;
    ultimoExternoRef.current = valorExterno;
    setValorLocal(valorExterno);
    setTouched(false);
    setErrorValidacion(null);
  }, [valorExterno]);

  const handleChange = (e) => {
    const valorFiltrado = soloNumeros(e.target.value);
    setValorLocal(valorFiltrado);
    onChange?.(valorFiltrado);
    setErrorValidacion(null);
  };

  const handleBlur = (e) => {
    setTouched(true);
    const err = validarNumero(valorLocal, { requerido: required, min, max, enteros });
    setErrorValidacion(err);
    onBlur?.(e);
  };

  const errorFinal = error || (touched ? errorValidacion : null);

  return (
    <div className={`form-group-filter ${className}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={valorLocal}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={errorFinal ? 'true' : 'false'}
        aria-describedby={errorFinal ? `${id}-error` : undefined}
        {...rest}
      />
      {errorFinal && (
        <span id={`${id}-error`} className="form-error-text" role="alert">
          {errorFinal}
        </span>
      )}
    </div>
  );
}