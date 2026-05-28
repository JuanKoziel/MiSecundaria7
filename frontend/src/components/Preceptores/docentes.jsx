import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { cursosPorAnio, docentesPorFiltros, nombreDocente } from './preceptorUtils';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import SelectorModo from './SelectorModo';

const formVacio = { dni: '', nombre: '', apellido: '' };

function nuevaAsignacion() {
  return { id: Date.now(), materia: '', anioLectivo: '', curso: '' };
}

function FiltrosDocentesVista({ anioLectivo, curso, materia, onAnio, onCurso, onMateria }) {
  const { aniosLectivos, inscripciones, cursos, materias } = useData();
  const cursosFiltrados = cursosPorAnio(anioLectivo, inscripciones, cursos);

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

function FormCrearDocente({ form, setForm, asignaciones, setAsignaciones }) {
  const { aniosLectivos, inscripciones, cursos, materias } = useData();
  const [borrador, setBorrador] = useState(nuevaAsignacion());
  const cursosBorrador = cursosPorAnio(borrador.anioLectivo, inscripciones, cursos);
  const agregarAsignacion = () => {
    if (!borrador.materia || !borrador.anioLectivo || !borrador.curso) {
      alert('Completá materia, año y curso antes de agregar.');
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
    setAsignaciones((prev) => [...prev, { ...borrador, id: Date.now() }]);
    setBorrador(nuevaAsignacion());
  };

  const quitarAsignacion = (id) => {
    setAsignaciones((prev) => prev.filter((a) => a.id !== id));
  };

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

      <h4 className="preceptor-section-title">Materias y asignaciones</h4>
      <p className="preceptor-modo-hint">
        Elegí una materia y definí en qué año y curso la dicta. Podés agregar varias.
      </p>

      <div className="upload-dashed-box">
        <div className="filter-row">
          <div className="form-group-filter">
            <label htmlFor="asig-materia">Materia</label>
            <select
              id="asig-materia"
              value={borrador.materia}
              onChange={(e) => setBorrador((p) => ({ ...p, materia: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              {materias.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-filter">
            <label htmlFor="asig-anio">Año lectivo</label>
            <select
              id="asig-anio"
              value={borrador.anioLectivo}
              onChange={(e) =>
                setBorrador((p) => ({ ...p, anioLectivo: e.target.value, curso: '' }))
              }
              disabled={!borrador.materia}
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
            <label htmlFor="asig-curso">Curso</label>
            <select
              id="asig-curso"
              value={borrador.curso}
              onChange={(e) => setBorrador((p) => ({ ...p, curso: e.target.value }))}
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
    </div>
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
  const [seleccionado, setSeleccionado] = useState('');

  const esCrear = modo === 'crear';
  const esVista = modo === 'vista';
  const necesitaFiltroVista = esVista;
  const necesitaFiltroCurso = modo === 'modificar' || modo === 'borrar';
  const lista = docentesPorFiltros(anioLectivo, curso, materia, dataCtx.docentes, dataCtx.asignacionesDocente);
  const docenteSel = lista.find((d) => String(d.id) === seleccionado);

  const resetModo = (m) => {
    setModo(m);
    setSeleccionado('');
    setForm(formVacio);
    setAsignaciones([]);
    setAnioLectivo('');
    setCurso('');
    setMateria('');
  };

  const handleGuardar = () => {
    if (esCrear) {
      alert(
        `Docente creado con ${asignaciones.length} asignación(es) (modo demostración).`,
      );
      return;
    }
    const acciones = {
      modificar: 'Docente modificado',
      borrar: 'Docente eliminado',
    };
    alert(`${acciones[modo] ?? 'Guardado'} (modo demostración).`);
  };

  const tablaVista = (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Materia</th>
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
            lista.map((d) => (
              <tr key={d.id}>
                <td>{d.dni}</td>
                <td>{nombreDocente(d)}</td>
                <td>{d.materia}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContenido = () => {
    if (esVista) return tablaVista;

    if (esCrear) {
      return (
        <FormCrearDocente
          form={form}
          setForm={setForm}
          asignaciones={asignaciones}
          setAsignaciones={setAsignaciones}
        />
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
                  setSeleccionado(e.target.value);
                  const d = lista.find((doc) => String(doc.id) === e.target.value);
                  if (d) {
                    setForm({
                      dni: d.dni,
                      nombre: d.nombre,
                      apellido: d.apellido,
                    });
                  }
                }}
              >
                <option value="">Seleccionar...</option>
                {lista.map((d) => (
                  <option key={d.id} value={d.id}>
                    {nombreDocente(d)} — {d.materia}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {docenteSel && (
            <div className="preceptor-form-grid" style={{ maxWidth: 520 }}>
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
              {lista.map((d) => (
                <option key={d.id} value={d.id}>
                  {nombreDocente(d)} — {d.materia}
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

  const bloqueadoModificarBorrar = necesitaFiltroCurso && (!anioLectivo || !curso);

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

          {necesitaFiltroCurso && (
            <FiltrosAnioCurso
              anioLectivo={anioLectivo}
              curso={curso}
              onAnioChange={(v) => {
                setAnioLectivo(v);
                setCurso('');
                setSeleccionado('');
              }}
              onCursoChange={setCurso}
            />
          )}

          {bloqueadoModificarBorrar ? (
            <EmptyFiltros mensaje="Seleccioná año lectivo y curso para continuar." />
          ) : (
            <>
              <div className="card-header-flex">
                <h3>{tituloModo[modo]}</h3>
                {modo !== 'vista' && (
                  <button type="button" className="btn btn-primary" onClick={handleGuardar}>
                    <i className="fas fa-save" aria-hidden="true" /> Guardar
                  </button>
                )}
              </div>
              {(esCrear || esVista || !bloqueadoModificarBorrar) && renderContenido()}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Docentes;
