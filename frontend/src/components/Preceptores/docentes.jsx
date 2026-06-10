import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { createDocente, updateDocente, deleteDocente, createCursoMateria, updateCursoMateria, deleteCursoMateria } from '../../services/api';
import { cursosPorAnio, docentesPorFiltros, nombreDocente } from './preceptorUtils';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import SelectorModo from './SelectorModo';

const formVacio = { dni: '', nombre: '', apellido: '' };

function nuevaAsignacion() {
  return { id: Date.now(), materia: '', anioLectivo: '', curso: '' };
}

function FiltrosDocentesVista({ anioLectivo, curso, materia, onAnio, onCurso, onMateria }) {
  const { aniosLectivos, inscripciones, cursos, materias, cursosObj } = useData();
  const cursosFiltrados = cursosPorAnio(anioLectivo, inscripciones, cursos, cursosObj);

  return (
    <div className="filter-row">
      <div className="form-group-filter">
        <label htmlFor="doc-anio">Año lectivo</label>
        <select
          id="doc-anio"
          value={anioLectivo}
          onChange={(e) => onAnio(e.target.value)}
        >
          <option value="">Todos los años</option>
          {aniosLectivos.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group-filter">
        <label htmlFor="doc-curso">Curso</label>
        <select
          id="doc-curso"
          value={curso}
          onChange={(e) => onCurso(e.target.value)}
          disabled={!anioLectivo}
        >
          <option value="">Todos los cursos</option>
          {cursosFiltrados.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group-filter">
        <label htmlFor="doc-materia-filtro">Materia</label>
        <select id="doc-materia-filtro" value={materia} onChange={(e) => onMateria(e.target.value)}>
          <option value="">Todas las materias</option>
          {materias.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AsignacionesEditor({ asignaciones, setAsignaciones, idPrefix }) {
  const { aniosLectivos, inscripciones, cursos, materias, cursosObj, cursoMateria, materiasObj } = useData();
  const [borrador, setBorrador] = useState(nuevaAsignacion());
  const cursosBorrador = cursosPorAnio(borrador.anioLectivo, inscripciones, cursos, cursosObj);

  // Filter materias based on selected course
  const materiasFiltradas = useMemo(() => {
    if (!borrador.curso || !borrador.anioLectivo) return [];
    
    // Get materia names directly from cursoMateria for the selected course
    const materiasCurso = cursoMateria
      .filter((cm) => cm.curso_nombre === borrador.curso)
      .map((cm) => cm.materia_nombre)
      .filter((m) => m); // Remove null/undefined
    
    return materiasCurso;
  }, [borrador.curso, borrador.anioLectivo, cursoMateria]);

  const agregarAsignacion = () => {
    if (!borrador.materia || !borrador.anioLectivo || !borrador.curso) {
      alert('Completá año, curso y materia antes de agregar.');
      return;
    }
    const duplicada = asignaciones.some(
      (a) =>
        a.materia === borrador.materia &&
        a.anioLectivo === borrador.anioLectivo &&
        a.curso === borrador.curso,
    );
    if (duplicada) {
      alert('Esa combinación de materia, año y curso ya fue agregada.');
      return;
    }
    setAsignaciones((prev) => [...prev, { ...borrador, id: Date.now(), isNew: true }]);
    setBorrador(nuevaAsignacion());
  };

  const quitarAsignacion = (id) => {
    setAsignaciones((prev) => prev.filter((a) => a.id !== id));
  };

  const prefix = idPrefix || 'asig';

  return (
    <>
      <h4 className="preceptor-section-title">Materias y asignaciones</h4>
      <p className="preceptor-modo-hint">
        Seleccioná el año lectivo y curso, luego elegí la materia asignada a ese curso. Podés agregar varias.
      </p>

      <div className="upload-dashed-box">
        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor={`${prefix}-anio`}>Año lectivo</label>
            <select
              id={`${prefix}-anio`}
              value={borrador.anioLectivo}
              onChange={(e) =>
                setBorrador((p) => ({ ...p, anioLectivo: e.target.value, curso: '', materia: '' }))
              }
            >
              <option value="">Año...</option>
              {aniosLectivos.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-filter">
            <label htmlFor={`${prefix}-curso`}>Curso</label>
            <select
              id={`${prefix}-curso`}
              value={borrador.curso}
              onChange={(e) => setBorrador((p) => ({ ...p, curso: e.target.value, materia: '' }))}
              disabled={!borrador.anioLectivo}
            >
              <option value="">Curso...</option>
              {cursosBorrador.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-filter">
            <label htmlFor={`${prefix}-materia`}>Materia</label>
            <select
              id={`${prefix}-materia`}
              value={borrador.materia}
              onChange={(e) => setBorrador((p) => ({ ...p, materia: e.target.value }))}
              disabled={!borrador.curso}
            >
              <option value="">Seleccionar...</option>
              {materiasFiltradas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="btn btn-success" onClick={agregarAsignacion}>
          <i className="fas fa-plus" aria-hidden="true" /> Agregar materia
        </button>
      </div>

      {asignaciones.length > 0 && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Año</th>
                <th>Curso</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((a) => (
                <tr key={a.id}>
                  <td className="table-cell-strong">{a.materia}</td>
                  <td>{a.anioLectivo}</td>
                  <td>{a.curso}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => quitarAsignacion(a.id)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Docentes() {
  const dataCtx = useData();
  const [modo, setModo] = useState('');
  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');
  const [materia, setMateria] = useState('');
  const [form, setForm] = useState(formVacio);
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionesOriginales, setAsignacionesOriginales] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const esCrear = modo === 'crear';
  const esVista = modo === 'vista';
  const necesitaFiltroVista = esVista;
  const necesitaFiltroCurso = modo === 'modificar' || modo === 'borrar';

  const allDocentes = dataCtx.docentes;
  const tieneAlgunFiltro = anioLectivo || curso || materia;
  const lista = esVista
    ? (tieneAlgunFiltro
        ? docentesPorFiltros(anioLectivo, curso, materia, allDocentes, dataCtx.asignacionesDocente)
        : allDocentes)
    : allDocentes;
  const docenteSel = lista.find((d) => String(d.id) === seleccionado);

  const resetModo = (m) => {
    setModo(m);
    setSeleccionado('');
    setForm(formVacio);
    setAsignaciones([]);
    setAsignacionesOriginales([]);
    setAnioLectivo('');
    setCurso('');
    setMateria('');
    setMensaje('');
  };

  const resolveIds = (asig) => {
    const cursoObj = (dataCtx.cursosObj || []).find(
      (c) => c.nombre_curso === asig.curso && c.ciclo_anio === Number(asig.anioLectivo),
    );
    const materiaObj = (dataCtx.materiasObj || []).find(
      (m) => m.nombre_materia === asig.materia,
    );
    return { id_curso: cursoObj?.id_curso, id_materia: materiaObj?.id_materia };
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje('');
    try {
      if (esCrear) {
        if (!form.dni || !form.nombre || !form.apellido) {
          setMensaje('Completá DNI, nombre y apellido.');
          setGuardando(false);
          return;
        }
        const docente = await createDocente({
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
        });
        const docenteId = docente.id_docente;
        let asigOk = 0;
        const errores = [];
        for (const asig of asignaciones) {
          const { id_curso, id_materia } = resolveIds(asig);
          if (!id_curso || !id_materia) {
            errores.push(`No se encontró curso/materia para ${asig.materia} - ${asig.curso} (${asig.anioLectivo})`);
            continue;
          }
          try {
            // Check if curso_materia already exists
            const existing = dataCtx.cursoMateria.find(
              (cm) => cm.id_curso === id_curso && cm.id_materia === id_materia
            );
            if (existing) {
              // Update existing record with docente
              await updateCursoMateria(existing.id, { id_docente: docenteId });
            } else {
              // Create new record
              await createCursoMateria({ id_curso, id_materia, id_docente: docenteId });
            }
            asigOk++;
          } catch (e) {
            const d = e.response?.data;
            const msg = d && typeof d === 'object' ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : (d?.detail || e.message);
            errores.push(`${asig.materia} - ${asig.curso}: ${msg}`);
          }
        }
        if (errores.length > 0) {
          setMensaje(`Docente creado. ${asigOk} asignación(es) guardadas. Errores: ${errores.join('; ')}`);
        } else {
          setMensaje(`Docente creado exitosamente con ${asigOk} asignación(es).`);
        }
        setForm(formVacio);
        setAsignaciones([]);
      } else if (modo === 'modificar') {
        if (!seleccionado) {
          setMensaje('Seleccioná un docente para modificar.');
          setGuardando(false);
          return;
        }
        await updateDocente(seleccionado, {
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
        });
        const originalesIds = asignacionesOriginales.map((a) => a.cmId);
        const actualesIds = asignaciones.filter((a) => a.cmId).map((a) => a.cmId);
        const paraEliminar = originalesIds.filter((id) => !actualesIds.includes(id));
        const paraCrear = asignaciones.filter((a) => a.isNew);
        for (const cmId of paraEliminar) {
          await deleteCursoMateria(cmId);
        }
        for (const asig of paraCrear) {
          const { id_curso, id_materia } = resolveIds(asig);
          if (id_curso && id_materia) {
            // Check if curso_materia already exists
            const existing = dataCtx.cursoMateria.find(
              (cm) => cm.id_curso === id_curso && cm.id_materia === id_materia
            );
            if (existing) {
              // Update existing record with docente
              await updateCursoMateria(existing.id, { id_docente: Number(seleccionado) });
            } else {
              // Create new record
              await createCursoMateria({ id_curso, id_materia, id_docente: Number(seleccionado) });
            }
          }
        }
        setMensaje('Docente modificado exitosamente.');
      } else if (modo === 'borrar') {
        if (!seleccionado) {
          setMensaje('Seleccioná un docente para eliminar.');
          setGuardando(false);
          return;
        }
        if (!confirm('¿Estás seguro de que querés eliminar este docente y todas sus asignaciones?')) {
          setGuardando(false);
          return;
        }
        await deleteDocente(seleccionado);
        setMensaje('Docente eliminado exitosamente.');
        setSeleccionado('');
      }
      await dataCtx.refreshData();
    } catch (err) {
      const data = err.response?.data;
      let msg = '';
      if (data && typeof data === 'object' && !data.detail) {
        msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
      } else {
        msg = data?.detail || err.message;
      }
      setMensaje(`Error: ${msg}`);
    } finally {
      setGuardando(false);
    }
  };

  const cargarAsignacionesDocente = (docenteId) => {
    const cms = (dataCtx.cursoMateria || []).filter((cm) => cm.id_docente === docenteId);
    const mapped = cms.map((cm) => {
      const cursoObj = (dataCtx.cursosObj || []).find((c) => c.id_curso === cm.id_curso);
      return {
        id: cm.id,
        cmId: cm.id,
        materia: cm.materia_nombre || '',
        anioLectivo: cursoObj?.ciclo_anio ? String(cursoObj.ciclo_anio) : '',
        curso: cm.curso_nombre || '',
        isNew: false,
      };
    });
    setAsignaciones(mapped);
    setAsignacionesOriginales(mapped);
  };

  const tablaVista = (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Asignaciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 ? (
            <tr>
              <td colSpan={3} className="empty-state-message">
                No hay docentes con los filtros seleccionados.
              </td>
            </tr>
          ) : (
            lista.map((d) => {
              const asigs = (dataCtx.cursoMateria || []).filter((cm) => cm.id_docente === d.id);
              const asigTexto = asigs.length > 0
                ? asigs.map((cm) => `${cm.materia_nombre} (${cm.curso_nombre})`).join(', ')
                : 'Sin asignaciones';
              return (
                <tr key={d.id}>
                  <td>{d.dni}</td>
                  <td>{nombreDocente(d)}</td>
                  <td>{asigTexto}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContenido = () => {
    if (esVista) return tablaVista;

    if (esCrear) {
      return (
        <div style={{ maxWidth: 640 }}>
          <div className="preceptor-form-grid">
            <div className="form-group-filter preceptor-form-full">
              <label htmlFor="doc-dni">DNI</label>
              <input
                id="doc-dni"
                type="text"
                value={form.dni}
                onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="doc-nombre">Nombre</label>
              <input
                id="doc-nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              />
            </div>
            <div className="form-group-filter">
              <label htmlFor="doc-apellido">Apellido</label>
              <input
                id="doc-apellido"
                type="text"
                value={form.apellido}
                onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
              />
            </div>
          </div>
          <AsignacionesEditor
            asignaciones={asignaciones}
            setAsignaciones={setAsignaciones}
            idPrefix="asig-crear"
          />
        </div>
      );
    }

    if (modo === 'modificar') {
      return (
        <>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="doc-select-mod">Docente</label>
              <select
                id="doc-select-mod"
                value={seleccionado}
                onChange={(e) => {
                  const val = e.target.value;
                  setSeleccionado(val);
                  const d = allDocentes.find((doc) => String(doc.id) === val);
                  if (d) {
                    setForm({ dni: d.dni, nombre: d.nombre, apellido: d.apellido });
                    cargarAsignacionesDocente(d.id);
                  }
                }}
              >
                <option value="">Seleccionar...</option>
                {allDocentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {nombreDocente(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {docenteSel && (
            <div style={{ maxWidth: 640 }}>
              <div className="preceptor-form-grid">
                <div className="form-group-filter preceptor-form-full">
                  <label htmlFor="doc-dni-mod">DNI</label>
                  <input
                    id="doc-dni-mod"
                    type="text"
                    value={form.dni}
                    onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="doc-nombre-mod">Nombre</label>
                  <input
                    id="doc-nombre-mod"
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>
                <div className="form-group-filter">
                  <label htmlFor="doc-apellido-mod">Apellido</label>
                  <input
                    id="doc-apellido-mod"
                    type="text"
                    value={form.apellido}
                    onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
                  />
                </div>
              </div>
              <AsignacionesEditor
                asignaciones={asignaciones}
                setAsignaciones={setAsignaciones}
                idPrefix="asig-mod"
              />
            </div>
          )}
        </>
      );
    }

    if (modo === 'borrar') {
      return (
        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="doc-select-del">Docente a eliminar</label>
            <select
              id="doc-select-del"
              value={seleccionado}
              onChange={(e) => setSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {allDocentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {nombreDocente(d)}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    return null;
  };

  const tituloModo = {
    vista: 'Vista general',
    crear: 'Crear docente',
    modificar: 'Modificar docente',
    borrar: 'Borrar docente',
  };

  return (
    <div className="card">
      <SelectorModo modo={modo} onModoChange={resetModo} titulo="Docentes — ¿Qué deseás hacer?" />

      {modo && (
        <>
          {necesitaFiltroVista && (
            <FiltrosDocentesVista
              anioLectivo={anioLectivo}
              curso={curso}
              materia={materia}
              onAnio={(v) => {
                setAnioLectivo(v);
                setCurso('');
              }}
              onCurso={setCurso}
              onMateria={setMateria}
            />
          )}

          <>
            <div className="card-header-flex">
              <h3>{tituloModo[modo]}</h3>
              {modo !== 'vista' && (
                <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
                  <i className="fas fa-save" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
            {mensaje && (
              <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green', margin: '8px 0' }}>
                {mensaje}
              </p>
            )}
            {renderContenido()}
          </>
        </>
      )}
    </div>
  );
}

export default Docentes;
