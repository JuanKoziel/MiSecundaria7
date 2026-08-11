let handler = null;

const MENSAJE_DEFECTO = '¿Está seguro de que desea eliminar este registro?';

export function setConfirmHandler(fn) {
  handler = fn;
}

async function confirmarEliminacion(mensaje = MENSAJE_DEFECTO, opciones = {}) {
  if (handler) {
    return handler({
      message: mensaje || MENSAJE_DEFECTO,
      ...opciones,
    });
  }
  return window.confirm(mensaje || MENSAJE_DEFECTO);
}

export default confirmarEliminacion;
