// Orientaciones SOLO visuales — no se almacenan en la base de datos.
// Regla: a partir de 4° año, división 1 = "Sociales", divisiones 2 y 3 = "Gestión".

// Extrae año y división de un nombre de curso tipo "4°1", "4° 1", "4-1", "41", "4°".
export function parseCurso(nombreCurso) {
  if (!nombreCurso) return { anio: null, division: null };
  const str = String(nombreCurso).trim();
  // Formato con símbolo de grado: "4°1", "4° 1" o "4°" (sin división).
  const degMatch = str.match(/^(\d+)\s*[°º]\s*(\d*)/);
  if (degMatch) {
    return {
      anio: Number(degMatch[1]),
      division: degMatch[2] ? Number(degMatch[2]) : null,
    };
  }
  const nums = str.match(/\d+/g);
  if (!nums) return { anio: null, division: null };
  if (nums.length >= 2) {
    return { anio: Number(nums[0]), division: Number(nums[1]) };
  }
  const digits = nums[0];
  if (digits.length >= 2) {
    return { anio: Number(digits[0]), division: Number(digits.slice(1)) };
  }
  return { anio: Number(digits), division: null };
}

// Devuelve la orientación ('Sociales' | 'Gestión' | '') para un curso.
export function orientacionDeCurso(nombreCurso) {
  const { anio, division } = parseCurso(nombreCurso);
  if (!anio || anio < 4) return '';
  if (division === 1) return 'Sociales';
  if (division === 2 || division === 3) return 'Gestión';
  return '';
}

// Devuelve el nombre del curso con la orientación, ej: "4°1 - Sociales".
export function cursoConOrientacion(nombreCurso) {
  const orientacion = orientacionDeCurso(nombreCurso);
  if (!nombreCurso) return '';
  return orientacion ? `${nombreCurso} - ${orientacion}` : String(nombreCurso);
}
