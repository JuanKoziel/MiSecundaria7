export function soloNumeros(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  return String(valor).replace(/[^0-9]/g, '');
}

export function validarNumero(valor, { requerido = false, min, max, enteros = true } = {}) {
  if (valor === '' || valor === null || valor === undefined) {
    if (requerido) return 'Este campo es obligatorio.';
    return null;
  }

  const soloNums = String(valor).replace(/[^0-9.-]/g, '');
  if (soloNums === '' || soloNums === '-' || soloNums === '.') {
    return 'Debe ser un número válido.';
  }

  const num = Number(soloNums);
  if (Number.isNaN(num)) {
    return 'Debe ser un número válido.';
  }

  if (enteros && !Number.isInteger(num)) {
    return 'Debe ser un número entero.';
  }

  if (min !== undefined && num < min) {
    return `El valor debe ser mayor o igual a ${min}.`;
  }

  if (max !== undefined && num > max) {
    return `El valor debe ser menor o igual a ${max}.`;
  }

  return null;
}

export function formatearNumero(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  const soloNums = String(valor).replace(/[^0-9]/g, '');
  return soloNums;
}