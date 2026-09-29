// Orientación: se MUESTRA la que se guardó al crear el curso (Curso.orientacion).
// Regla del punto 5.2: no se infiere ni se asigna a partir del año o la división.
// Si el curso no tiene orientación guardada, se muestra "—" / "Sin orientación".

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

// Devuelve la orientación GUARDADA del curso, sin inferirla.
// Acepta el objeto curso. Si se le pasa un simple nombre no se puede saber la
// orientación guardada, por lo que devuelve '' en lugar de inventarla.
export function orientacionDeCurso(curso) {
  if (!curso || typeof curso !== 'object') return '';
  return String(curso.orientacion || '').trim();
}

// Igual que orientacionDeCurso, pero resuelve el curso por nombre dentro de una
// lista de cursos que ya vine del backend.
export function orientacionDeCursoPorNombre(nombreCurso, cursos = []) {
  if (!nombreCurso) return '';
  const objetivo = String(nombreCurso).trim();
  const encontrado = (cursos || []).find(
    (c) => String(c.nombre_curso || '').trim() === objetivo,
  );
  return orientacionDeCurso(encontrado);
}

// Devuelve el nombre del curso con la orientación guardada, ej: "4°1 - Sociales".
// Acepta el objeto curso o un nombre. Con un nombre solo, no se agrega orientación
// porque no se puede inferir.
export function cursoConOrientacion(curso) {
  if (!curso) return '';
  if (typeof curso !== 'object') return String(curso);
  const nombre = curso.nombre_curso || curso.curso || '';
  const orientacion = orientacionDeCurso(curso);
  return orientacion ? `${nombre} - ${orientacion}` : String(nombre);
}
