import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './sidebar/sidebar';
import Header from './header/header';
import Estudiantes from './estudiantes';
import Docentes from './docentes';
import Horarios from './horarios';
import Asistencias from './asistencias';
import Notas from './notas';
import Comunicados from './comunicados';
import Notificaciones from '../Notificaciones';
import DiagnosticosView from '../Shared/DiagnosticosView';
import Administradores from './administradores';
import Preceptores from './preceptores';
import Cursos from './cursos';
import Materias from './materias';
import Suplencias from './suplencias';
import CalendarioInstitucional from './CalendarioInstitucional';
import Historial from './historial';
import AdelantosHoras from '../Shared/AdelantosHoras';
import PanelAdmin from './PanelAdmin';
import Actas from '../Preceptores/actas';
import TutoresFamilias from '../Preceptores/tutoresFamilias';
import Configuracion from './configuracion/Configuracion';
import { getDirectivos } from '../../services/api';
import { useData } from '../../context/DataContext';
import { viewDesdeDestino } from '../../utils/navDestinos';
import { resolverCursosSeleccionados, firmaSeleccion } from '../../utils/seleccionCurso';

function AdminDashboard({ user, onLogout }) {
const {
navIntent,
cursosObj,
selectedCursos,
selectedCursoIds,
setSeleccionCursoMateria,
setSeleccionCursos,
} = useData();
  const [view, setView] = useState('perfil');
  const [directivos, setDirectivos] = useState([]);

  // 5.6 — multiselección de cursos. `curso` se sigue manteniendo con el primero
  // de la lista para las vistas que todavía filtran por un curso solo.
  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');
  const [cursos, setCursos] = useState([]);

  // Parte 8 / 5.1: manejar navegación desde notificaciones. Además de cambiar de
  // vista, deja el curso (y el año lectivo) ya seleccionados en el header global
  // para que la vista destino abra con el contexto de la notificación.
  // Se aplica UNA vez por navegación (guarda por timestamp) para que un refresco
  // de `cursosObj` no vuelva a pisar la elección manual del header.
  const navAplicadoRef = useRef(null);
  const [cursoPendienteNav, setCursoPendienteNav] = useState('');

  useEffect(() => {
    if (!navIntent || !navIntent.destino) return;
    if (navAplicadoRef.current === navIntent.timestamp) return;
    navAplicadoRef.current = navIntent.timestamp;

    const vista = viewDesdeDestino(navIntent.destino, user.role);
    if (vista) setView(vista);

    const p = navIntent.params || {};
    const anio = p.anio ?? p.anioLectivo ?? null;
    if (anio) setAnioLectivo(String(anio));

    // El curso puede venir por id o por nombre; el header trabaja con nombre.
    const porNombre = p.cursoNombre ?? p.curso_nombre
      ?? (typeof p.curso === 'string' && /[°º]/.test(p.curso) ? p.curso : null)
      ?? null;
    const porId = p.cursoId ?? p.curso_id
      ?? (typeof p.curso === 'string' && p.curso && !/[°º]/.test(p.curso) ? p.curso : null)
      ?? null;

    // 5.6 — la notificación trae un curso puntual, así que se deja marcada solo
    // esa división (y no todas las del año).
    if (porNombre) {
      setCursos([String(porNombre)]);
      setCurso(String(porNombre));
      setCursoPendienteNav('');
    } else if (porId) {
      setCursoPendienteNav(String(porId));
    }
  }, [navIntent, user.role]);

  // Si el curso llegó por id y la lista aún no estaba cargada, se resuelve el
  // nombre en cuanto llegan los cursos para que el header muestre la selección.
  useEffect(() => {
    if (!cursoPendienteNav) return;
    const encontrado = (cursosObj || []).find(
      (c) => String(c.id_curso) === String(cursoPendienteNav),
    );
    if (encontrado) {
      setCursos([String(encontrado.nombre_curso)]);
      setCurso(String(encontrado.nombre_curso));
      setCursoPendienteNav('');
    }
  }, [cursoPendienteNav, cursosObj]);

  const handleAnioChange = (nuevoAnio) => {
    setAnioLectivo(nuevoAnio);
    setCurso('');
    setCursos([]);
  };

  const handleCursosChange = useCallback((lista) => {
    const nombres = (Array.isArray(lista) ? lista : []).filter(Boolean);
    setCursos(nombres);
    setCurso(nombres[0] || '');
  }, []);

  // Punto 1.4: el header es la única fuente de selección. Lo que se elige ahí se
  // publica en el contexto global para que las vistas consuman siempre el mismo
  // curso y no vuelvan a mostrar selectores duplicados.
  // 5.6: publicar el curso (y su lista) es tarea del efecto de abajo, que va
  // después. Acá solo se limpia la materia cuando el curso de referencia cambia,
  // porque una materia de otra división mostraría datos ajenos.
  const cursoPrevioRef = useRef(curso);
  useEffect(() => {
    if (cursoPrevioRef.current === curso) return;
    cursoPrevioRef.current = curso;
    const seleccionado = (cursosObj || []).find((c) => c.nombre_curso === curso);
    setSeleccionCursoMateria(
      seleccionado?.id_curso ? String(seleccionado.id_curso) : '',
      '',
      '',
    );
  }, [curso, cursosObj, setSeleccionCursoMateria]);

  // Un curso incompleto ("1°", año sin división) no corresponde a ningún curso
  // real: se publica como "sin selección" y se les pasa vacío a las vistas, para
  // que ninguna filtre por un nombre que no está en los datos.
  const cursosResueltos = useMemo(() => {
    const candidatos = cursos.length > 0 ? cursos : (curso ? [curso] : []);
    return resolverCursosSeleccionados(candidatos, cursosObj);
  }, [cursos, curso, cursosObj]);

  useEffect(() => {
    const { nombres, ids } = cursosResueltos;
    const firma = firmaSeleccion(nombres, ids);
    if (firma === firmaSeleccion(selectedCursos, selectedCursoIds)) return;
    setSeleccionCursos(nombres, ids);
  }, [cursosResueltos, selectedCursos, selectedCursoIds, setSeleccionCursos]);

  const filtrosProps = {
    anioLectivo,
    curso: cursosResueltos.nombres[0] || '',
    cursos: cursosResueltos.nombres,
    onAnioChange: handleAnioChange,
    onCursoChange: setCurso,
    onCursosChange: handleCursosChange,
  };

  useEffect(() => {
    getDirectivos()
      .then(setDirectivos)
      .catch(() => setDirectivos([]));
  }, []);

  const miDirectivo = directivos.find((d) => d.id_usuario === user?.id) || null;
  const nombreCompletoAdmin = miDirectivo ? `${miDirectivo.apellido}, ${miDirectivo.nombre}` : null;

  const renderView = () => {
    switch (view) {
      case 'perfil':
        return <PanelAdmin miDirectivo={miDirectivo} user={user} />;
      case 'alumnos':
        return <Estudiantes {...filtrosProps} />;
      case 'docentes':
        return <Docentes {...filtrosProps} />;
      case 'preceptores':
        return <Preceptores {...filtrosProps} />;
      case 'jefes-preceptores':
        return <Preceptores rol="jefe_preceptores" {...filtrosProps} />;
      case 'horarios':
        return <Horarios {...filtrosProps} />;
      case 'adelantos-horas':
        return <AdelantosHoras {...filtrosProps} />;
      case 'asistencias':
        return <Asistencias {...filtrosProps} />;
      case 'calendario':
        return <CalendarioInstitucional {...filtrosProps} />;
      case 'notas':
        return <Notas {...filtrosProps} />;
      case 'comunicados':
        return <Comunicados {...filtrosProps} />;
      case 'cursos':
        return <Cursos {...filtrosProps} />;
      case 'materias':
        return <Materias {...filtrosProps} />;
      case 'suplencias':
        return <Suplencias {...filtrosProps} />;
      case 'historial':
        return <Historial {...filtrosProps} />;
      case 'tutores':
        return <TutoresFamilias {...filtrosProps} />;
      case 'actas':
        return <Actas {...filtrosProps} />;
      case 'info':
        return <DiagnosticosView userRole={user.role === 'director' ? 'director' : 'admin'} {...filtrosProps} />;
      case 'administradores':
        return <Administradores {...filtrosProps} />;
      case 'notificaciones':
        return <Notificaciones userRole={user.role} {...filtrosProps} />;
      // Configuración: cada submenú abre su pestaña de catálogo. `view` ES la
      // pestaña, así el submenú lateral, las pestañas internas y la
      // navegación por `navIntent` no pueden desincronizarse.
      case 'ciclos-lectivos':
      case 'modulos-horarios':
      case 'periodos-evaluacion':
      case 'estados-asistencia':
      case 'tipos-acta':
        return <Configuracion pestana={view} onPestanaChange={setView} />;
      default:
        return <Estudiantes {...filtrosProps} />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar view={view} setView={setView} onLogout={onLogout} />

      <main className="main-content">
            <Header
              user={user}
              nombreCompleto={nombreCompletoAdmin}
              anioLectivo={anioLectivo}
              curso={curso}
              cursos={cursos}
              onAnioChange={handleAnioChange}
              onCursoChange={setCurso}
              onCursosChange={handleCursosChange}
            />
        <div className="view-section active">{renderView()}</div>
      </main>
    </div>
  );
}

export default AdminDashboard;
