<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { fetchAlumnos } from '../../api/services';
import ApiError from '../common/ApiError';
import CursoFilter from './CursoFilter';
import { useCursos } from './useCursos';

function Alumnos() {
  const { cursos, curso, setCurso, error: cursosError, loading: cursosLoading } = useCursos();
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!curso) return;
    setLoading(true);
    setError('');
    fetchAlumnos(curso)
      .then(setAlumnos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [curso]);

  const displayError = cursosError || error;
=======
import { useState } from 'react';
import { aniosLectivos, nombreCompleto } from '../../data/mockData';
import FiltrosAnioCurso from './FiltrosAnioCurso';
import EmptyFiltros from './EmptyFiltros';
import SelectorModo from './SelectorModo';
import { alumnosPorAnioYCurso, cursosPorAnio, filtrosCompletos } from './preceptorUtils';

const formVacio = { dni: '', nombre: '', apellido: '', anioLectivo: '', curso: '' };

function Alumnos() {
  const [modo, setModo] = useState('');
  const [anioLectivo, setAnioLectivo] = useState('');
  const [curso, setCurso] = useState('');
  const [observaciones, setObservaciones] = useState({});
  const [form, setForm] = useState(formVacio);
  const [seleccionado, setSeleccionado] = useState('');

  const lista = alumnosPorAnioYCurso(anioLectivo, curso);
  const alumnoSel = lista.find((a) => String(a.id) === seleccionado);
  const esCrear = modo === 'crear';
  const necesitaFiltroCurso = modo && !esCrear;
  const filtrosOk = filtrosCompletos(anioLectivo, curso);
  const cursosCrear = cursosPorAnio(form.anioLectivo);

  const resetModo = (m) => {
    setModo(m);
    setSeleccionado('');
    setForm(formVacio);
    setAnioLectivo('');
    setCurso('');
  };

  const handleAnioFiltro = (nuevoAnio) => {
    setAnioLectivo(nuevoAnio);
    setCurso('');
    setSeleccionado('');
  };

  const handleGuardar = () => {
    const acciones = {
      crear: `Alumno creado en ${form.curso} (${form.anioLectivo})`,
      modificar: `Alumno modificado — ${curso} (${anioLectivo})`,
      borrar: `Alumno eliminado — ${curso} (${anioLectivo})`,
      vista: `Consulta — ${curso} (${anioLectivo})`,
    };
    alert(acciones[modo] ?? 'Guardado');
  };

  const renderContenido = () => {
    if (modo === 'vista') {
      return (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre Completo</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={2} className="empty-state-message">
                    No hay alumnos inscriptos en este curso.
                  </td>
                </tr>
              ) : (
                lista.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.dni}</strong>
                    </td>
                    <td>{nombreCompleto(a)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (esCrear) {
      return (
        <div className="preceptor-form-grid" style={{ maxWidth: 560 }}>
          <div className="form-group-filter preceptor-form-full">
            <label htmlFor="alumno-dni">DNI</label>
            <input
              id="alumno-dni"
              type="text"
              value={form.dni}
              onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))}
            />
          </div>
          <div className="form-group-filter">
            <label htmlFor="alumno-nombre">Nombre</label>
            <input
              id="alumno-nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            />
          </div>
          <div className="form-group-filter">
            <label htmlFor="alumno-apellido">Apellido</label>
            <input
              id="alumno-apellido"
              type="text"
              value={form.apellido}
              onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
            />
          </div>
          <div className="form-group-filter preceptor-form-full">
            <p className="preceptor-section-title" style={{ margin: '8px 0 0' }}>
              Inscripción
            </p>
          </div>
          <div className="form-group-filter">
            <label htmlFor="alumno-anio-crear">Año lectivo</label>
            <select
              id="alumno-anio-crear"
              value={form.anioLectivo}
              onChange={(e) =>
                setForm((p) => ({ ...p, anioLectivo: e.target.value, curso: '' }))
              }
            >
              <option value="">Seleccionar año...</option>
              {aniosLectivos.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-filter">
            <label htmlFor="alumno-curso-crear">Curso</label>
            <select
              id="alumno-curso-crear"
              value={form.curso}
              onChange={(e) => setForm((p) => ({ ...p, curso: e.target.value }))}
              disabled={!form.anioLectivo}
            >
              <option value="">Seleccionar curso...</option>
              {cursosCrear.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (modo === 'modificar') {
      return (
        <>
          <div className="filter-row">
            <div className="form-group-filter">
              <label htmlFor="alumno-select-mod">Alumno</label>
              <select
                id="alumno-select-mod"
                value={seleccionado}
                onChange={(e) => {
                  setSeleccionado(e.target.value);
                  const a = lista.find((al) => String(al.id) === e.target.value);
                  if (a) {
                    setForm({
                      dni: a.dni,
                      nombre: a.nombre,
                      apellido: a.apellido,
                      anioLectivo: '',
                      curso: '',
                    });
                  }
                }}
              >
                <option value="">Seleccionar...</option>
                {lista.map((a) => (
                  <option key={a.id} value={a.id}>
                    {nombreCompleto(a)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {alumnoSel && (
            <div className="preceptor-form-grid" style={{ maxWidth: 520 }}>
              <div className="form-group-filter preceptor-form-full">
                <label htmlFor="alumno-dni-mod">DNI</label>
                <input
                  id="alumno-dni-mod"
                  type="text"
                  value={form.dni}
                  onChange={(e) => setForm((p) => ({ ...p, dni: e.target.value }))}
                />
              </div>
              <div className="form-group-filter">
                <label htmlFor="alumno-nombre-mod">Nombre</label>
                <input
                  id="alumno-nombre-mod"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div className="form-group-filter">
                <label htmlFor="alumno-apellido-mod">Apellido</label>
                <input
                  id="alumno-apellido-mod"
                  type="text"
                  value={form.apellido}
                  onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))}
                />
              </div>
              <div className="form-group-filter preceptor-form-full">
                <label htmlFor="alumno-obs-mod">Observaciones</label>
                <input
                  id="alumno-obs-mod"
                  type="text"
                  value={observaciones[alumnoSel.id] ?? ''}
                  onChange={(e) =>
                    setObservaciones((prev) => ({
                      ...prev,
                      [alumnoSel.id]: e.target.value,
                    }))
                  }
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
            <label htmlFor="alumno-select-del">Alumno a eliminar</label>
            <select
              id="alumno-select-del"
              value={seleccionado}
              onChange={(e) => setSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {lista.map((a) => (
                <option key={a.id} value={a.id}>
                  {nombreCompleto(a)} — {a.dni}
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
    crear: 'Crear alumno',
    modificar: 'Modificar alumno',
    borrar: 'Borrar alumno',
  };
>>>>>>> main

  return (
    <div className="card">
      <SelectorModo modo={modo} onModoChange={resetModo} titulo="Alumnos — ¿Qué deseás hacer?" />

<<<<<<< HEAD
      <CursoFilter cursos={cursos} value={curso} onChange={setCurso} id="curso-alumnos" />
      <ApiError message={displayError} />

      {cursosLoading || loading ? (
        <p className="empty-state-message">Cargando alumnos...</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Curso</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.dni}</strong></td>
                  <td>{a.apellido}, {a.nombre}</td>
                  <td>{a.curso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
=======
      {modo && (
        <>
          {necesitaFiltroCurso && (
            <FiltrosAnioCurso
              anioLectivo={anioLectivo}
              curso={curso}
              onAnioChange={handleAnioFiltro}
              onCursoChange={setCurso}
            />
          )}

          {necesitaFiltroCurso && !filtrosOk ? (
            <EmptyFiltros />
          ) : (
            <>
              <div className="card-header-flex">
                <h3>
                  {tituloModo[modo]}
                  {filtrosOk && ` — ${curso} (${anioLectivo})`}
                </h3>
                {modo !== 'vista' && (
                  <button type="button" className="btn btn-primary" onClick={handleGuardar}>
                    <i className="fas fa-save" aria-hidden="true" /> Guardar
                  </button>
                )}
              </div>
              {renderContenido()}
            </>
          )}
        </>
>>>>>>> main
      )}
    </div>
  );
}

export default Alumnos;
