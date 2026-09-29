function eventoCubreFecha(evento, fechaStr, cursoMateriaId) {
  const f = new Date(fechaStr + 'T00:00:00');
  const evFecha = new Date(evento.fecha + 'T00:00:00');
  
  if (evento.permanente) {
    return f.getMonth() === evFecha.getMonth() && f.getDate() === evFecha.getDate();
  }
  
  return f.getFullYear() === evFecha.getFullYear() &&
         f.getMonth() === evFecha.getMonth() &&
         f.getDate() === evFecha.getDate();
}

export function haySuspensionEnFecha(eventosInstitucionales, fechaStr, cursoMateriaId = null) {
  if (!Array.isArray(eventosInstitucionales) || !fechaStr) {
    return null;
  }
  
  const suspensiones = eventosInstitucionales.filter((ev) => 
    ev.tipo_evento === 'Suspension' && eventoCubreFecha(ev, fechaStr, cursoMateriaId)
  );
  
  if (suspensiones.length === 0) {
    return null;
  }
  
  return suspensiones[0];
}

export function obtenerEventosDelDia(eventosInstitucionales, fechaStr) {
  if (!Array.isArray(eventosInstitucionales) || !fechaStr) {
    return [];
  }
  
  return eventosInstitucionales.filter((ev) => eventoCubreFecha(ev, fechaStr));
}

export function hayBloqueoEscritura(eventosInstitucionales, fechaStr, cursoMateriaId = null) {
  const suspension = haySuspensionEnFecha(eventosInstitucionales, fechaStr, cursoMateriaId);
  if (!suspension) return false;
  
  return suspension.alcance !== 'sin_bloqueo';
}

export function getSuspensionInfo(eventosInstitucionales, fechaStr, cursoMateriaId = null) {
  const suspension = haySuspensionEnFecha(eventosInstitucionales, fechaStr, cursoMateriaId);
  if (!suspension) return null;
  
  return {
    tipo: suspension.tipo_evento,
    descripcion: suspension.descripcion,
    alcance: suspension.alcance,
    hora_inicio: suspension.hora_inicio,
    hora_fin: suspension.hora_fin,
    bloqueaEscritura: suspension.alcance !== 'sin_bloqueo',
  };
}