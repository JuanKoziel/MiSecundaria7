const CAMPOS_LEGIBLES = {
  usuario: 'usuario',
  usuario_nombre: 'usuario',
  contrasena: 'contraseña',
  password: 'contraseña',
  dni: 'DNI',
  apellido: 'apellido',
  nombre: 'nombre',
  correo: 'correo',
  telefono: 'teléfono',
  fecha: 'fecha',
  titulo: 'título',
  cuerpo: 'cuerpo',
  archivo: 'archivo',
  curso: 'curso',
  materia: 'materia',
  division: 'división',
  id_curso: 'curso',
  id_materia: 'materia',
  id_docente: 'docente',
};

function traducirCampo(campo) {
  return CAMPOS_LEGIBLES[campo] || campo.replace(/_/g, ' ');
}

function aplanarMensajes(valor) {
  if (Array.isArray(valor)) {
    const textos = valor.map((v) => (typeof v === 'string' ? v : aplanarMensajes(v))).filter(Boolean);
    return textos.length === 1 ? textos[0] : textos.join(' ');
  }
  return valor;
}

function limpiarTexto(texto) {
  return String(texto)
    .replace(/["'{}[\]\\]/g, '')
    .replace(/^\s+|\s+$/g, '');
}

export function mensajeErrorAmigable(err, fallback = 'Ocurrió un error. Inténtalo de nuevo.') {
  const data = err?.response?.data ?? err?.data;

  if (typeof data === 'string') {
    return limpiarTexto(data) || fallback;
  }

  if (data && typeof data === 'object') {
    const entradas = Object.entries(data);
    if (entradas.length === 0) return fallback;

    const partes = [];
    for (const [campo, valor] of entradas) {
      const msg = aplanarMensajes(valor);
      if (!msg) continue;

      if (campo === 'detail' || campo === 'error' || campo === 'message' || campo === 'non_field_errors') {
        partes.push(limpiarTexto(msg));
      } else {
        const prefijo = traducirCampo(campo);
        partes.push(`${prefijo}: ${limpiarTexto(msg)}`);
      }
    }

    if (partes.some((p) => /(error|inválido|inválida|válido|válida|no puede|no se puede|ya existe|correctamente|obligatorio|requerido|debe )/i.test(p))) {
      return partes.filter(Boolean).join(' - ');
    }
    return partes.filter(Boolean).join('. ') || fallback;
  }

  const mensajeFallido = err?.message || null;
  if (mensajeFallido && !/^fetch |^network|failed to fetch|request failed/i.test(mensajeFallido)) {
    return limpiarTexto(mensajeFallido) || fallback;
  }

  if (err?.status === 0 || err?.request || !data) {
    return 'No se pudo conectar con el servidor. Comprobá tu conexión e intentá de nuevo.';
  }

  return fallback;
}