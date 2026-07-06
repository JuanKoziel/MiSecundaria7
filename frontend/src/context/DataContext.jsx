import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAlumnos,
  getDocentes,
  getPreceptores,
  getCursos,
  getMaterias,
  getCursoMateria,
  getCalificaciones,
  getAsistencias,
  getActas,
  getActaAlumno,
  getActaCurso,
  getActaDocente,
  getHorarios,
  getModulos,
  getCiclosLectivos,
  getEstadosAsistencia,
  getNotificaciones,
  getInscripciones,
  getPadresTutores,
  getPeriodos,
  getComunicados,
  getDiagnosticosGrupales,
  getPlanificaciones,
} from '../services/api';

const DataContext = createContext(null);

function nombreCompleto(alumno) {
  return `${alumno.apellido}, ${alumno.nombre}`;
}

function nombreCorto(alumno) {
  return `${alumno.nombre} ${alumno.apellido}`;
}

function scopeFromAlcance(alcance) {
  if (!alcance) return 'general';
  const hasCiclo = alcance.id_ciclo !== null && alcance.id_ciclo !== undefined;
  const hasCurso = alcance.curso !== null && alcance.curso !== undefined;
  const hasDivision = alcance.division !== null && alcance.division !== undefined;
  const hasMateria = alcance.id_materia !== null && alcance.id_materia !== undefined;
  if (!hasCiclo && !hasCurso && !hasDivision && !hasMateria) return 'general';
  if (hasCiclo && !hasCurso && !hasDivision && !hasMateria) return 'year';
  if (hasCiclo && hasCurso && !hasDivision && !hasMateria) return 'course';
  if (hasCiclo && hasCurso && hasDivision && !hasMateria) return 'division';
  if (hasCiclo && hasCurso && hasDivision && hasMateria) return 'subject';
  return 'general';
}

function buildAlcanceLabel(alcance) {
  if (!alcance) return 'General';
  const scope = scopeFromAlcance(alcance);
  const curso = alcance.curso !== null && alcance.curso !== undefined ? `${alcance.curso}°` : '';
  const division = alcance.division !== null && alcance.division !== undefined ? `${alcance.division}` : '';

  if (scope === 'general' || scope === 'year') return 'General';
  if (scope === 'course') return curso;
  if (scope === 'division' || scope === 'subject') return `${curso}${division}`;
  return 'General';
}

function buildAlcanceLabels(alcances) {
  const labels = (Array.isArray(alcances) ? alcances : [])
    .map((alcance) => buildAlcanceLabel(alcance))
    .filter(Boolean);
  return [...new Set(labels)];
}

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminCursos, setAdminCursos] = useState([]);
  const [adminMaterias, setAdminMaterias] = useState([]);
  const [adminCursoMateria, setAdminCursoMateria] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        alumnosRaw,
        docentesRaw,
        preceptoresRaw,
        cursosRaw,
        materiasRaw,
        cursoMateriaRaw,
        calificacionesRaw,
        asistenciasRaw,
        actasRaw,
        actaAlumnoRaw,
        actaCursoRaw,
        actaDocenteRaw,
        horariosRaw,
        modulosRaw,
        ciclosRaw,
        estadosRaw,
        notificacionesRaw,
        inscripcionesRaw,
        padresTutoresRaw,
        periodosRaw,
        comunicadosRaw,
        diagnosticosRaw,
        planificacionesRaw,
      ] = await Promise.all([
        getAlumnos().catch(() => []),
        getDocentes().catch(() => []),
        getPreceptores().catch(() => []),
        getCursos().catch(() => []),
        getMaterias().catch(() => []),
        getCursoMateria().catch((err) => {
          console.error('Error fetching cursoMateria:', err);
          return [];
        }),
        getCalificaciones().catch(() => []),
        getAsistencias().catch(() => []),
        getActas().catch(() => []),
        getActaAlumno().catch(() => []),
        getActaCurso().catch(() => []),
        getActaDocente().catch(() => []),
        getHorarios().catch(() => []),
        getModulos().catch(() => []),
        getCiclosLectivos().catch(() => []),
        getEstadosAsistencia().catch(() => []),
        getNotificaciones().catch(() => []),
        getInscripciones().catch(() => []),
        getPadresTutores().catch(() => []),
        getPeriodos().catch(() => []),
        getComunicados().catch(() => []),
        getDiagnosticosGrupales().catch(() => []),
        getPlanificaciones().catch(() => []),
      ]);

      const alumnosPreCurso = (Array.isArray(alumnosRaw) ? alumnosRaw : []).map((a) => ({
        id: a.id_alumno,
        dni: a.dni,
        nombre: a.nombre,
        apellido: a.apellido,
        usuario: a.usuario || '',
        usuario_estado: a.usuario_estado ?? null,
        usuario_fecha_deshabilitacion_programada: a.usuario_fecha_deshabilitacion_programada || null,
        usuario_fecha_habilitacion_programada: a.usuario_fecha_habilitacion_programada || null,
        estado_label: a.estado_label || '',
        proxima_accion_programada: a.proxima_accion_programada || null,
        curso_nombre_api: a.curso_nombre || '',
        id_curso: a.id_curso,
        id_tutor: a.id_tutor || null,
        id_usuario: a.id_usuario || null,
        fecha_nacimiento: a.fecha_nacimiento || null,
        direccion: a.direccion || '',
        telefono: a.telefono || '',
        procedencia: a.procedencia || '',
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
            id_usuario: d.id_usuario || null,
            usuario: d.usuario || '',
            usuario_estado: d.usuario_estado ?? null,
            usuario_fecha_deshabilitacion_programada: d.usuario_fecha_deshabilitacion_programada || null,
            usuario_fecha_habilitacion_programada: d.usuario_fecha_habilitacion_programada || null,
            estado_label: d.estado_label || '',
            proxima_accion_programada: d.proxima_accion_programada || null,
            ddjj_id: d.ddjj_id || null,
            ruta_ddjj: d.ruta_ddjj || null,
            ddjj_presentada: Boolean(d.ddjj_presentada),
            ddjj_fecha_carga: d.ddjj_fecha_carga || null,
            ddjj_nombre_archivo: d.ddjj_nombre_archivo || null,
            ddjj_url: d.ddjj_url || d.ruta_ddjj || null,
            dni: d.dni,
            nombre: d.nombre,
            apellido: d.apellido,
            correo: d.correo || '',
            telefono: d.telefono || '',
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
            if (!existing.cursoMateriaIds.includes(cm.id)) {
              existing.cursoMateriaIds.push(cm.id);
            }
          } else {
            d.asignaciones.push({
              curso: cm.curso_nombre || '',
              materias: [cm.materia_nombre || ''],
              cursoMateriaIds: [cm.id],
            });
          }
        }
      });
      const docentes = Object.values(docenteMap);

      const preceptores = (Array.isArray(preceptoresRaw) ? preceptoresRaw : []).map((p) => ({
        id: p.id_preceptor,
        id_usuario: p.id_usuario || null,
        usuario: p.usuario || '',
        estado: p.usuario_estado ?? null,
        fecha_deshabilitacion_programada: p.usuario_fecha_deshabilitacion_programada || null,
        fecha_habilitacion_programada: p.usuario_fecha_habilitacion_programada || null,
        dni: p.dni,
        nombre: p.nombre,
        apellido: p.apellido,
        telefono: p.telefono || '',
        cursos: Array.isArray(p.cursos_asignados) ? p.cursos_asignados : [],
      }));

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

      const materiasObjArr = (Array.isArray(materiasRaw) ? materiasRaw : []);
      const materias = materiasObjArr.map((m) => m.nombre_materia);

      const materiasPorCurso = {};
      cursoMateria.forEach((cm) => {
        const cName = cm.curso_nombre || '';
        if (!materiasPorCurso[cName]) materiasPorCurso[cName] = [];
        if (cm.materia_nombre && !materiasPorCurso[cName].includes(cm.materia_nombre)) {
          materiasPorCurso[cName].push(cm.materia_nombre);
        }
      });

      const modulosArr = (Array.isArray(modulosRaw) ? modulosRaw : [])
        .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
      const modulosPorId = {};
      modulosArr.forEach((m) => { modulosPorId[m.id_modulo] = m; });

      const horariosClase = {};
      (Array.isArray(horariosRaw) ? horariosRaw : []).forEach((h) => {
        const cm = cursoMateria.find((c) => c.id === h.id_curso_materia);
        if (cm) {
          const mod = modulosPorId[h.id_modulo];
          if (mod) {
            horariosClase[cm.materia_nombre] = `${String(mod.hora_inicio).slice(0, 5)} - ${String(mod.hora_fin).slice(0, 5)}`;
          }
        }
      });

      const horarios = (Array.isArray(horariosRaw) ? horariosRaw : []).map((h) => {
        const cm = cursoMateria.find((c) => c.id === h.id_curso_materia);
        const cursoObj = cm
          ? cursosObjArr.find((c) => c.id_curso === cm.id_curso)
          : null;
        const mod = modulosPorId[h.id_modulo];
        return {
          id: h.id_horario,
          id_curso_materia: h.id_curso_materia,
          id_modulo: h.id_modulo ?? null,
          id_curso: cm?.id_curso || h.id_curso || null,
          curso_nombre: h.curso_nombre || cm?.curso_nombre || '',
          materia_nombre: h.materia_nombre || cm?.materia_nombre || '',
          docente_nombre: h.docente_nombre || cm?.docente_nombre || '',
          ciclo_anio: cursoObj?.ciclo_anio || null,
          dia_semana: h.dia_semana || '',
          numero_modulo: modulosArr.findIndex((m) => m.id_modulo === h.id_modulo) + 1 || null,
          hora_inicio: mod ? String(mod.hora_inicio).slice(0, 5) : '',
          hora_fin: mod ? String(mod.hora_fin).slice(0, 5) : '',
          aula: h.aula || '',
        };
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

      const periodosArr = (Array.isArray(periodosRaw) ? periodosRaw : []);
      const periodoOrderMap = {};
      periodosArr.forEach((p) => {
        periodoOrderMap[p.id_periodo] = p.orden_periodo || 0;
      });

      const calGroups = {};
      calificacionesArr.forEach((c) => {
        const key = `${c.id_alumno}-${c.id_curso_materia}`;
        if (!calGroups[key]) {
          calGroups[key] = {
            alumnoId: c.id_alumno,
            id_curso_materia: c.id_curso_materia,
            curso: c.curso_nombre || '',
            materia: c.materia_nombre || '',
            prenota1: '', nota1: '', prenota2: '', nota2: '',
            diagnostico: '',
            calId1: null, calId2: null,
          };
        }
        const g = calGroups[key];
        const orden = periodoOrderMap[c.id_periodo] || 0;
        if (orden <= 1) {
          g.prenota1 = c.pre_nota || '';
          g.nota1 = c.nota_numerica ?? '';
          g.diagnostico = c.diagnostico || g.diagnostico;
          g.calId1 = c.id_calificacion;
        } else if (orden === 2) {
          g.prenota2 = c.pre_nota || '';
          g.nota2 = c.nota_numerica ?? '';
          if (c.diagnostico) g.diagnostico = c.diagnostico;
          g.calId2 = c.id_calificacion;
        }
      });
      const notasDocenteAdmin = Object.values(calGroups).map((g, idx) => ({
        id: idx + 1,
        ...g,
      }));

      const asistenciasArr = (Array.isArray(asistenciasRaw) ? asistenciasRaw : []);
      const asistenciasAdmin = asistenciasArr.map((a) => ({
        id: a.id_asistencia,
        curso: a.curso_nombre || '',
        materia: a.materia_nombre || '',
        fecha: a.fecha || '',
        hora: a.hora || '',
        alumnoId: a.id_alumno,
        estado: a.estado_nombre || '',
        id_curso_materia: a.id_curso_materia,
      }));

      const actasArr = (Array.isArray(actasRaw) ? actasRaw : []).map((a) => ({
        id: a.id_acta,
        titulo: a.titulo || '',
        descripcion: a.descripcion || '',
        fecha: a.fecha || '',
        tipo: a.tipo_acta_nombre || '',
        ruta_archivo: a.ruta_archivo || null,
        autor: a.creador_nombre || '',
      }));

      const actaAlumnoArr = (Array.isArray(actaAlumnoRaw) ? actaAlumnoRaw : []);
      const actaCursoArr = (Array.isArray(actaCursoRaw) ? actaCursoRaw : []);

      const actasAlumno = actaAlumnoArr.map((aa) => {
        const acta = actasArr.find((a) => a.id === aa.id_acta);
        return {
          id: aa.id_acta_alumno || aa.id,
          actaId: aa.id_acta,
          alumnoId: aa.id_alumno,
          titulo: acta?.titulo || '',
          materia: '',
          fecha: acta?.fecha || '',
          descripcion: acta?.descripcion || '',
          cargadoPor: '',
          autor: acta?.autor || '',
          ruta_archivo: acta?.ruta_archivo || null,
        };
      });

      const actaDocenteArr = (Array.isArray(actaDocenteRaw) ? actaDocenteRaw : []);
      const actasDocente = actaDocenteArr.map((ad) => {
        const acta = actasArr.find((a) => a.id === ad.id_acta);
        return {
          id: ad.id_acta_docente || ad.id,
          actaId: ad.id_acta,
          docenteId: ad.id_docente,
          titulo: acta?.titulo || '',
          fecha: acta?.fecha || '',
          descripcion: acta?.descripcion || '',
          autor: acta?.autor || '',
          ruta_archivo: acta?.ruta_archivo || null,
        };
      });

      const actasCurso = actaCursoArr.map((ac) => {
        const acta = actasArr.find((a) => a.id === ac.id_acta);
        const cursoObj = cursosObjArr.find((c) => c.id_curso === ac.id_curso);
        return {
          id: ac.id_acta_curso || ac.id,
          actaId: ac.id_acta,
          curso: cursoObj?.nombre_curso || '',
          fecha: acta?.fecha || '',
          descripcion: acta?.descripcion || '',
          titulo: acta?.titulo || '',
          ruta_archivo: acta?.ruta_archivo || null,
        };
      });

      const padresTutores = (Array.isArray(padresTutoresRaw) ? padresTutoresRaw : []);
      const hijosFamilia = alumnos
        .filter((a) => a.id)
        .map((a, idx) => ({
          id: idx + 1,
          alumnoId: a.id,
          curso: a.curso,
          vinculo: 'Tutor',
          id_tutor: a.id_tutor || null,
        }));

      const calificacionesFamilia = notasDocenteAdmin.map((n, idx) => ({
        id: idx + 1,
        hijoId: hijosFamilia.find((h) => h.alumnoId === n.alumnoId)?.id || 0,
        alumnoId: n.alumnoId,
        id_curso_materia: n.id_curso_materia,
        curso: n.curso,
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

      const comunicados = (Array.isArray(comunicadosRaw) ? comunicadosRaw : []).map((c) => {
        const cursoObj = cursosObjArr.find((x) => x.id_curso === c.id_curso) || null;
        const alcances = Array.isArray(c.alcances) ? c.alcances : [];
        const alcance = alcances[0] || null;
        const alcanceLabels = buildAlcanceLabels(alcances);
        const alcanceLabel = alcanceLabels.length > 0 ? alcanceLabels.join(', ') : 'General';
        const cicloId = alcances.find((a) => a.id_ciclo)?.id_ciclo || null;
        const cicloObj = cicloId
          ? ciclosRaw.find((cy) => Number(cy.id_ciclo) === Number(cicloId))
          : null;
        const materiaId = alcances.find((a) => a.id_materia)?.id_materia || c.id_materia || null;
        const materiaObj = materiaId
          ? materiasObjArr.find((m) => Number(m.id_materia) === Number(materiaId))
          : null;
        return {
          id: c.id_comunicado,
          id_curso: c.id_curso,
          id_materia: materiaId ? Number(materiaId) : null,
          cursoId: c.id_curso,
          materiaId: materiaId ? Number(materiaId) : null,
          curso: c.curso_nombre || cursoObj?.nombre_curso || '',
          anio_lectivo: cicloObj?.anio || null,
          alcance_label: alcanceLabel,
          alcance,
          alcances,
          alcance_labels: alcanceLabels,
          creador_nombre: c.creador_nombre || c.id_usuario_creador_nombre || '',
          materia: c.materia_nombre || materiaObj?.nombre_materia || '',
          fecha: c.fecha || '',
          titulo: c.titulo || '',
          cuerpo: c.cuerpo || '',
          descripcion: c.cuerpo || '',
          archivos: Array.isArray(c.archivos)
            ? c.archivos.map((a) => ({
                id: a.id_comunicado_archivo,
                ruta_archivo: a.ruta_archivo,
              }))
            : [],
        };
      });
      const comunicadosFamilia = comunicados;

      const diagnosticos = (Array.isArray(diagnosticosRaw) ? diagnosticosRaw : []).map((d) => {
        const cursoObj = cursosObjArr.find((x) => x.id_curso === d.id_curso);
        const docenteObj = docentes.find((doc) => doc.id === d.id_docente);
        return {
          id: d.id_diagnostico_grupal,
          id_curso: d.id_curso,
          id_docente: d.id_docente,
          curso: d.curso_nombre || cursoObj?.nombre_curso || '',
          docente: docenteObj ? `${docenteObj.nombre} ${docenteObj.apellido}` : '',
          fecha: d.fecha || '',
          descripcion: d.descripcion || '',
        };
      });

      const planificaciones = (Array.isArray(planificacionesRaw) ? planificacionesRaw : []).map((p) => ({
        id: p.id_planificacion,
        id_docente: p.id_docente,
        id_curso_materia: p.id_curso_materia,
        ruta_archivo: p.ruta_archivo || null,
        fecha_subida: p.fecha_subida || null,
      }));



      setData({
        alumnos,
        docentes,
        preceptores,
        cursos,
        cursosObj: cursosObjArr,
        materiasObj: materiasObjArr,
        materias,
        materiasPorCurso,
        horariosClase,
        horarios,
        modulos: modulosArr,
        aniosLectivos,
        ciclosLectivos,
        estadosAsistencia,
        inscripciones,
        asignacionesDocente,
        cursoMateria,
        notasDocenteAdmin,
        calificacionesCompletas: calificacionesArr,
        periodos: periodosArr,
        asistenciasAdmin,
        actasAlumno,
        actasDocente,
        actas: actasCurso,
        hijosFamilia,
        calificacionesFamilia,
        asistenciasFamilia,
        comunicadosFamilia,
        comunicados,
        diagnosticos,
        planificaciones,
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

  const refreshAdminCursos = useCallback(async (incluirInactivos = false) => {
    const params = incluirInactivos ? { incluir_inactivos: 1 } : {};
    const raw = await getCursos(params).catch(() => []);
    setAdminCursos(Array.isArray(raw) ? raw : []);
  }, []);

  const refreshAdminMaterias = useCallback(async (incluirInactivos = false) => {
    const params = incluirInactivos ? { incluir_inactivos: 1 } : {};
    const raw = await getMaterias(params).catch(() => []);
    setAdminMaterias(Array.isArray(raw) ? raw : []);
  }, []);

  const refreshAdminCursoMateria = useCallback(async (idCurso, incluirInactivos = false) => {
    if (!idCurso) { setAdminCursoMateria([]); return; }
    const params = { curso: idCurso };
    if (incluirInactivos) params.incluir_inactivos = 1;
    const raw = await getCursoMateria(params).catch(() => []);
    setAdminCursoMateria(Array.isArray(raw) ? raw : []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (data) {
    data.refreshData = fetchData;
  }

  return (
    <DataContext.Provider value={{
      data, loading, error, refreshData: fetchData,
      adminCursos, adminMaterias, adminCursoMateria,
      refreshAdminCursos, refreshAdminMaterias, refreshAdminCursoMateria,
    }}>
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
      preceptores: [],
      cursos: [],
      cursosObj: [],
      materiasObj: [],
      materias: [],
      materiasPorCurso: {},
      horariosClase: {},
      horarios: [],
      modulos: [],
      aniosLectivos: [],
      estadosAsistencia: [],
      inscripciones: [],
      asignacionesDocente: [],
      cursoMateria: [],
      notasDocenteAdmin: [],
      asistenciasAdmin: [],
      actasAlumno: [],
      actasDocente: [],
      actas: [],
      hijosFamilia: [],
      calificacionesFamilia: [],
      asistenciasFamilia: [],
      comunicadosFamilia: [],
      comunicados: [],
      diagnosticos: [],
      planificaciones: [],
      calificacionesCompletas: [],
      periodos: [],
      padresTutores: [],
      ciclosLectivos: [],
      nombreCompleto: (a) => `${a.apellido}, ${a.nombre}`,
      nombreCorto: (a) => `${a.nombre} ${a.apellido}`,
      getAlumnoById: () => null,
      getHijoLabel: () => 'Alumno',
      getAlumnosByCurso: () => [],
      getMateriasByCurso: () => [],
      getHorarioClase: () => '—',
      getActasByAlumnoId: () => [],
      refreshData: () => {},
      adminCursos: [],
      adminMaterias: [],
      adminCursoMateria: [],
      refreshAdminCursos: () => {},
      refreshAdminMaterias: () => {},
      refreshAdminCursoMateria: () => {},
    };
  }
  return {
    loading: false, error: null,
    ...ctx.data,
    refreshData: ctx.refreshData,
    adminCursos: ctx.adminCursos,
    adminMaterias: ctx.adminMaterias,
    adminCursoMateria: ctx.adminCursoMateria,
    refreshAdminCursos: ctx.refreshAdminCursos,
    refreshAdminMaterias: ctx.refreshAdminMaterias,
    refreshAdminCursoMateria: ctx.refreshAdminCursoMateria,
  };
}
