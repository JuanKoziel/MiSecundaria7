const MENSAJE_DEFECTO = '¿Está seguro de que desea eliminar este registro?\n\nEsta acción no se puede deshacer.';

function confirmarEliminacion(mensaje = MENSAJE_DEFECTO) {
  return window.confirm(mensaje || MENSAJE_DEFECTO);
}

export default confirmarEliminacion;
