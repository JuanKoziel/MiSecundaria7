import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAlumnos,
  getDocentes,
  getCursos,
  getMaterias,
  getCursoMateria,
  getCalificaciones,
  getAsistencias,
  getActas,
  getActaAlumno,
  getActaCurso,
  getHorarios,
  getCiclosLectivos,
  getEstadosAsistencia,
  getNotificaciones,
  getInscripciones,
  getPadresTutores,
} from '../services/api';

const DataContext = createContext(null);

function nombreCompleto(alumno) {
  return `${alumno.apellido}, ${alumno.nombre}`;
}

function nombreCorto(alumno) {
  return `${alumno.nombre} ${alumno.apellido}`;
}

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        alumnosRaw,
        docentesRaw,
        cursosRaw,
        materiasRaw,
        cursoMateriaRaw,
        calificacionesRaw,
        asistenciasRaw,
        actasRaw,
        actaAlumnoRaw,
        actaCursoRaw,
        horariosRaw,
        ciclosRaw,
        estadosRaw,
        notificacionesRaw,
        inscripcionesRaw,
        padresTutoresRaw,
      ] = await Promise.all([
        getAlumnos().catch(() => []),
        getDocentes().catch(() => []),
        getCursos().catch(() => []),
        getMaterias().catch(() => []),
        getCursoMateria().catch(() => []),
        getCalificaciones().catch(() => []),
        getAsistencias().catch(() => []),
        getActas().catch(() => []),
        getActaAlumno().catch(() => []),
        getActaCurso().catch(() => []),
        getHorarios().catch(() => []),
        getCiclosLectivos().catch(() => []),
        getEstadosAsistencia().catch(() => []),
        getNotificaciones().catch(() => []),
        getInscripciones().catch(() => []),
        getPadresTutores().catch(() => []),
      ]);

      const alumnosPreCurso = (Array.isArray(alumnosRaw) ? alumnosRaw : []).map((a) => ({
        id: a.id_alumno,
        dni: a.dni,
        nombre: a.nombre,
        apellido: a.apellido,
        curso_nombre_api: a.curso_nombre || '',
        id_curso: a.id_curso,
      }));

      const cursoMateria = (Array.isArray(cursoMateriaRaw) ? cursoMateriaRaw : []).map((cm) => ({
        id: cm.id_curso_materia,
        id_curso: cm.id_curso,
        id_materia: cm.id_materia,
        id_docente: cm.id_docente,
        curso_nombre: cm.curso_nombre,
        materia_nombre: cm.materia_nombre,
        docente_nombre: cm.docente_nombre,
      }));

      const docenteMap = {};
      (Array.isArray(docentesRaw) ? docentesRaw : []).forEach((d) => {
        const id = d.id_docente;
        if (!docenteMap[id]) {
          docenteMap[id] = {
            id,
            dni: d.dni,
            nombre: d.nombre,
            apellido: d.apellido,
            materia: '',
            asignaciones: [],
          };
        }
      });
      cursoMateria.forEach((cm) => {
        if (cm.id_docente && docenteMap[cm.id_docente]) {
          const d = docenteMap[cm.id_docente];
          const existing = d.asignaciones.find((a) => a.curso === cm.curso_nombre);
          if (existing) {
            if (!existing.materias.includes(cm.materia_nombre)) {
              existing.materias.push(cm.materia_nombre);
            }
          } else {
            d.asignaciones.push({
              curso: cm.curso_nombre || '',
              materias: [cm.materia_nombre || ''],
            });
          }
        }
      });
      const docentes = Object.values(docenteMap);

      const cursosArr = (Array.isArray(cursosRaw) ? cursosRaw : []).map((c) => c.nombre_curso);
      const cursos = cursosArr.length > 0 ? cursosArr : [
        '1°1', '1°2', '1°3', '2°1', '2°2', '2°3',
        '3°1', '3°2', '3°3', '4°1', '4°2', '4°3',
        '5°1', '5°2', '5°3', '6°1', '6°2', '6°3',
      ];

      const cursosObjArr = (Array.isArray(cursosRaw) ? cursosRaw : []);

      const alumnos = alumnosPreCurso.map((a) => {
        const cObj = cursosObjArr.find((c) => c.id_curso === a.id_curso);
        return {
          ...a,
          curso: a.curso_nombre_api || cObj?.nombre_curso || '',
          ciclo_anio: cObj?.ciclo_anio || null,
        };
      });

      const materias = (Array.isArray(materiasRaw) ? materiasRaw : []).map(
        (m) => m.nombre_materia,
      );

      const materiasPorCurso = {};
      cursoMateria.forEach((cm) => {
        const cName = cm.curso_nombre || '';
        if (!materiasPorCurso[cName]) materiasPorCurso[cName] = [];
        if (cm.materia_nombre && !materiasPorCurso[cName].includes(cm.materia_nombre)) {
          materiasPorCurso[cName].push(cm.materia_nombre);
        }
      });

      const horariosClase = {};
      (Array.isArray(horariosRaw) ? horariosRaw : []).forEach((h) => {
        const cm = cursoMateria.find((c) => c.id === h.id_curso_materia);
        if (cm) {
          horariosClase[cm.materia_nombre] = `${h.hora_inicio || ''} - ${h.hora_fin || ''}`;
        }
      });

      const estadosAsistencia = (Array.isArray(estadosRaw) ? estadosRaw : []);

      const ciclosLectivos = (Array.isArray(ciclosRaw) ? ciclosRaw : []);
      const aniosLectivos = ciclosLectivos.map((c) => c.anio);

      const inscripciones = (Array.isArray(inscripcionesRaw) ? inscripcionesRaw : []).map((i) => {
        const cm = cursoMateria.find((c) => c.id === i.id_curso_materia);
        const cursoObj = cm ? cursosObjArr.find((c) => c.id_curso === cm.id_curso) : null;
        return {
          id: i.id_inscripcion,
          alumnoId: i.id_alumno,
          anioLectivo: cursoObj?.ciclo_anio || 0,
          curso: cursoObj?.nombre_curso || '',
        };
      });

      const asignacionesDocente = cursoMateria.map((cm) => {
        const cursoObj = cursosObjArr.find((c) => c.id_curso === cm.id_curso);
        return {
          id: cm.id,
          docenteId: cm.id_docente,
          anioLectivo: cursoObj?.ciclo_anio || 0,
          curso: cm.curso_nombre || '',
          materia: cm.materia_nombre || '',
        };
      });

      const calificacionesArr = (Array.isArray(calificacionesRaw) ? calificacionesRaw : []);

      const notasDocenteAdmin = calificacionesArr.map((c) => ({
        id: c.id_calificacion,
        curso: c.curso_nombre || '',
        materia: c.materia_nombre || '',
        alumnoId: c.id_alumno,
        prenota1: c.pre_nota || '',
        nota1: c.nota_numerica ?? '',
        prenota2: '',
        nota2: '',
        diagnostico: c.diagnostico || '',
      }));

      const asistenciasArr = (Array.isArray(asistenciasRaw) ? asistenciasRaw : []);
      const asistenciasAdmin = asistenciasArr.map((a) => ({
        id: a.id_asistencia,
        curso: a.curso_nombre || '',
        materia: a.materia_nombre || '',
        fecha: a.fecha || '',
        alumnoId: a.id_alumno,
        estado: a.estado_nombre || '',
      }));

      const actasArr = (Array.isArray(actasRaw) ? actasRaw : []).map((a) => ({
        id: a.id_acta,
        titulo: a.titulo || '',
        descripcion: a.descripcion || '',
        fecha: a.fecha || '',
        tipo: a.tipo_acta_nombre || '',
      }));

      const actaAlumnoArr = (Array.isArray(actaAlumnoRaw) ? actaAlumnoRaw : []);
      const actaCursoArr = (Array.isArray(actaCursoRaw) ? actaCursoRaw : []);

      const actasAlumno = actaAlumnoArr.map((aa) => {
        const acta = actasArr.find((a) => a.id === aa.id_acta);
        return {
          id: aa.id_acta_alumno || aa.id,
          alumnoId: aa.id_alumno,
          titulo: acta?.titulo || '',
          materia: '',
          fecha: acta?.fecha || '',
          cargadoPor: '',
          archivo: '',
        };
      });

      const actasCurso = actaCursoArr.map((ac) => {
        const acta = actasArr.find((a) => a.id === ac.id_acta);
        const cursoObj = cursosObjArr.find((c) => c.id_curso === ac.id_curso);
        return {
          id: ac.id_acta_curso || ac.id,
          curso: cursoObj?.nombre_curso || '',
          fecha: acta?.fecha || '',
          descripcion: acta?.descripcion || '',
        };
      });

      const padresTutores = (Array.isArray(padresTutoresRaw) ? padresTutoresRaw : []);
      const hijosFamilia = alumnos
        .filter((a) => a.id)
        .map((a, idx) => ({
          id: idx + 1,
          alumnoId: a.id,
          curso: a.curso,
          vinculo: 'Padre/Madre/Tutor',
        }));

      const calificacionesFamilia = notasDocenteAdmin.map((n, idx) => ({
        id: idx + 1,
        hijoId: hijosFamilia.find((h) => h.alumnoId === n.alumnoId)?.id || 0,
        materia: n.materia,
        prenota1: n.prenota1,
        nota1: n.nota1,
        prenota2: n.prenota2,
        nota2: n.nota2,
        diagnostico: n.diagnostico,
      }));

      const asistenciasFamilia = asistenciasAdmin.map((a, idx) => ({
        id: idx + 1,
        hijoId: hijosFamilia.find((h) => h.alumnoId === a.alumnoId)?.id || 0,
        fecha: a.fecha,
        estado: a.estado,
      }));

      const comunicadosFamilia = (Array.isArray(notificacionesRaw) ? notificacionesRaw : []).map(
        (n) => {
          const cursoObj = cursosObjArr.find((c) => c.id_curso === n.id_curso);
          return {
            id: n.id_notificacion,
            curso: cursoObj?.nombre_curso || '',
            fecha: n.fecha || '',
            titulo: n.titulo || '',
            descripcion: n.mensaje || '',
          };
        },
      );

      const alumnosDocenteInicial = alumnos.map((a) => ({
        id: a.id,
        nombre: `${a.apellido}, ${a.nombre}`,
        prenota1: '',
        nota1: '',
        prenota2: '',
        nota2: '',
        diag: '',
      }));

      const asistenciaDocenteInicial = alumnos.map((a) => ({
        id: a.id,
        nombre: `${a.apellido}, ${a.nombre}`,
        estado: 'Presente',
      }));

      setData({
        alumnos,
        docentes,
        cursos,
        cursosObj: cursosObjArr,
        materias,
        materiasPorCurso,
        horariosClase,
        aniosLectivos,
        ciclosLectivos,
        estadosAsistencia,
        inscripciones,
        asignacionesDocente,
        cursoMateria,
        notasDocenteAdmin,
        asistenciasAdmin,
        actasAlumno,
        actas: actasCurso,
        hijosFamilia,
        calificacionesFamilia,
        asistenciasFamilia,
        comunicadosFamilia,
        alumnosDocenteInicial,
        asistenciaDocenteInicial,
        padresTutores,
        nombreCompleto,
        nombreCorto,
        getAlumnoById: (alumnoId) => alumnos.find((a) => a.id === alumnoId),
        getHijoLabel: (hijo) => {
          const alumno = alumnos.find((a) => a.id === hijo.alumnoId);
          if (!alumno) return 'Alumno';
          return `${nombreCorto(alumno)} (${hijo.curso})`;
        },
        getAlumnosByCurso: (curso) => alumnos.filter((a) => a.curso === curso),
        getMateriasByCurso: (curso) => materiasPorCurso[curso] ?? [],
        getHorarioClase: (materia) => horariosClase[materia] ?? '—',
        getActasByAlumnoId: (alumnoId) =>
          actasAlumno
            .filter((a) => a.alumnoId === alumnoId)
            .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')),
        refreshData: null,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos del servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (data) {
    data.refreshData = fetchData;
  }

  return (
    <DataContext.Provider value={{ data, loading, error, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  if (ctx.loading || !ctx.data) {
    return {
      loading: true,
      error: ctx.error,
      alumnos: [],
      docentes: [],
      cursos: [],
      cursosObj: [],
      materias: [],
      materiasPorCurso: {},
      horariosClase: {},
      aniosLectivos: [],
      estadosAsistencia: [],
      inscripciones: [],
      asignacionesDocente: [],
      cursoMateria: [],
      notasDocenteAdmin: [],
      asistenciasAdmin: [],
      actasAlumno: [],
      actas: [],
      hijosFamilia: [],
      calificacionesFamilia: [],
      asistenciasFamilia: [],
      comunicadosFamilia: [],
      alumnosDocenteInicial: [],
      asistenciaDocenteInicial: [],
      nombreCompleto: (a) => `${a.apellido}, ${a.nombre}`,
      nombreCorto: (a) => `${a.nombre} ${a.apellido}`,
      getAlumnoById: () => null,
      getHijoLabel: () => 'Alumno',
      getAlumnosByCurso: () => [],
      getMateriasByCurso: () => [],
      getHorarioClase: () => '—',
      getActasByAlumnoId: () => [],
      refreshData: () => {},
    };
  }
  return { loading: false, error: null, ...ctx.data, refreshData: ctx.refreshData };
}
