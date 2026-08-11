import { useMemo, useState, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { getCursoMateria, getHorarios, getHorariosEspeciales, getSuplencias, getAdelantosHoras } from '../../services/api';
import { suplenciasActivasLista } from '../../utils/suplencias';
import LoadingSpinner from '../Shared/LoadingSpinner';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function timeStr(value) {
  if (!value) return '';
  const s = typeof value === 'string' ? value : String(value);
  return s.slice(0, 5);
}

function calcularTurno(horarios) {
  let manana = 0;
  let tarde = 0;
  horarios.forEach((h) => {
    const hora = h.modulo_hora_inicio;
    if (hora) {
      const hour = parseInt(String(hora).slice(0, 2), 10);
      if (hour < 12) manana++;
      else tarde++;
    }
  });
  if (manana > tarde) return 'Mañana';
  if (tarde > manana) return 'Tarde';
  return '';
}

function obtenerPreceptorNombre(cursoObj) {
  if (!cursoObj) return null;
  if (cursoObj.preceptor_nombre_completo) return cursoObj.preceptor_nombre_completo;
  if (cursoObj.preceptor_nombre) {
    const parts = cursoObj.preceptor_nombre.split(', ');
    if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
    return cursoObj.preceptor_nombre;
  }
  return null;
}

function formatearDocenteNombre(valor) {
  if (!valor) return null;
  const parts = valor.split(', ');
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return valor;
}

function buildTimeSlots(modulosSorted, horariosEspeciales, horarios, materiasLookup, docentesLookup, suplenciasActivas) {
  const horariosLookup = {};
  horarios.forEach((h) => {
    const key = `${h.dia_semana}_${h.id_modulo}`;
    horariosLookup[key] = h;
  });

  const suplentesByCm = {};
  (suplenciasActivas || []).forEach((s) => {
    if (!s || !s.id_curso_materia) return;
    if (!suplentesByCm[s.id_curso_materia]) suplentesByCm[s.id_curso_materia] = [];
    suplentesByCm[s.id_curso_materia].push(s);
  });
  Object.keys(suplentesByCm).forEach((cmId) => {
    suplentesByCm[cmId].sort((a, b) => (a.nivel ?? 1) - (b.nivel ?? 1));
  });
  const suplentesDe = (cmId) => (suplentesByCm[cmId] || []).map((s) => ({
    key: s.id_suplencia ?? `${cmId}_${s.nivel ?? 1}`,
    nivel: s.nivel ?? 1,
    nombre: formatearDocenteNombre(s.suplente_nombre),
  }));

  const especialesByDay = {};
  horariosEspeciales.forEach((h) => {
    if (!especialesByDay[h.dia_semana]) especialesByDay[h.dia_semana] = [];
    especialesByDay[h.dia_semana].push(h);
  });

  const slots = [];

  modulosSorted.forEach((mod) => {
    DIAS.forEach((dia) => {
      const key = `${dia}_${mod.id_modulo}`;
      if (horariosLookup[key]) {
        slots.push({
          id: `mod_${mod.id_modulo}_${dia}`,
          tipo: 'modulo',
          hora_inicio: timeStr(mod.hora_inicio),
          hora_fin: timeStr(mod.hora_fin),
          dia,
          id_modulo: mod.id_modulo,
          materia_nombre: materiasLookup[horariosLookup[key].id_curso_materia] || null,
          docente_nombre: formatearDocenteNombre(docentesLookup[horariosLookup[key].id_curso_materia]),
          id_curso_materia: horariosLookup[key].id_curso_materia,
          aula: horariosLookup[key].aula || null,
          suplentes: suplentesDe(horariosLookup[key].id_curso_materia),
        });
      }
    });
  });

  DIAS.forEach((dia) => {
    (especialesByDay[dia] || []).forEach((h) => {
      slots.push({
        id: `esp_${h.id_horario_especial}`,
        tipo: 'especial',
        hora_inicio: timeStr(h.hora_inicio),
        hora_fin: timeStr(h.hora_fin),
        dia,
        id_modulo: null,
          materia_nombre: materiasLookup[h.id_curso_materia] || null,
          docente_nombre: formatearDocenteNombre(docentesLookup[h.id_curso_materia]),
          id_curso_materia: h.id_curso_materia,
        aula: h.aula || null,
        suplentes: suplentesDe(h.id_curso_materia),
      });
    });
  });

  slots.sort((a, b) => {
    if (a.dia !== b.dia) return DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia);
    return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
  });

  const daySlots = {};
  DIAS.forEach((dia) => { daySlots[dia] = []; });
  const seen = new Set();
  slots.forEach((s) => {
    const dedupKey = `${s.dia}_${s.hora_inicio}_${s.hora_fin}_${s.materia_nombre || ''}_${s.tipo}`;
    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      daySlots[s.dia].push(s);
    }
  });

  const allTimes = {};
  DIAS.forEach((dia) => {
    daySlots[dia].forEach((s) => {
      allTimes[s.hora_inicio + '_' + s.hora_fin] = true;
    });
  });

  return { daySlots, allTimes };
}

function computeRowspans(daySlots) {
  const rowspans = {};
  DIAS.forEach((dia) => {
    const slots = daySlots[dia] || [];
    let i = 0;
    while (i < slots.length) {
      const current = slots[i];
      if (!current.materia_nombre) {
        rowspans[current.id] = 1;
        i++;
        continue;
      }
      let count = 1;
      while (
        i + count < slots.length &&
        slots[i + count].materia_nombre === current.materia_nombre &&
        slots[i + count].tipo === 'modulo' &&
        current.tipo === 'modulo'
      ) {
        count++;
      }
      rowspans[current.id] = count;
      for (let j = 1; j < count; j++) {
        rowspans[slots[i + j].id] = 0;
      }
      i += count;
    }
  });
  return rowspans;
}

function buildRowsHtml(daySlots, timeKeys, rowspans, nombreCursoDisplay, turno, preceptorNombre) {
  const visibleTimes = Object.keys(timeKeys).sort((a, b) => a.localeCompare(b));
  const remaining = {};
  DIAS.forEach((d) => { remaining[d] = 0; });
  const colspan = DIAS.length + 1;
  const preceptorTexto = preceptorNombre || '-';

  let theadHtml = `<tr class="info-row"><th colspan="${colspan}"><div class="info-row-inner"><span class="info-left">Curso: ${nombreCursoDisplay}</span><span class="info-center">Turno: ${turno}</span><span class="info-right">Preceptor: ${preceptorTexto}</span></div></th></tr>`;
  theadHtml += `<tr><th>Horario</th>${DIAS.map((d) => `<th>${d}</th>`).join('')}</tr>`;

  let rowsHtml = '';

  visibleTimes.forEach((timeKey) => {
    const [hInicio, hFin] = timeKey.split('_');

    const hasContent = DIAS.some((dia) => {
      const slot = (daySlots[dia] || []).find(
        (s) => s.hora_inicio === hInicio && s.hora_fin === hFin,
      );
      return slot && slot.materia_nombre;
    });
    if (!hasContent) return;

    rowsHtml += '<tr>';
    rowsHtml += `<td class="time-col">${hInicio} – ${hFin}</td>`;

    DIAS.forEach((dia) => {
      if (remaining[dia] > 0) {
        remaining[dia]--;
        return;
      }

      const slot = (daySlots[dia] || []).find(
        (s) => s.hora_inicio === hInicio && s.hora_fin === hFin,
      );
      if (!slot) {
        rowsHtml += '<td></td>';
        return;
      }
      const rs = rowspans[slot.id] || 1;
      if (rs === 0) return;
      if (rs > 1) remaining[dia] = rs - 1;

      const esEspecial = slot.tipo === 'especial';
      rowsHtml += `<td rowspan="${rs}" class="${esEspecial ? 'especial' : ''}">`;
      if (slot.materia_nombre) {
        rowsHtml += `<div class="materia">${slot.materia_nombre}</div>`;
        rowsHtml += `<div class="docente">${slot.docente_nombre || '-'}</div>`;
        if (slot.aula) {
          rowsHtml += `<div class="aula">${slot.aula}</div>`;
        }
        (slot.suplentes || []).forEach((sp) => {
          rowsHtml += `<div class="suplente"><span class="suplente-label">${sp.nivel > 1 ? `Suplente nivel ${sp.nivel}` : 'Suplente'}</span> ${sp.nombre || '-'}</div>`;
        });
      }
      rowsHtml += '</td>';
    });

    rowsHtml += '</tr>';
  });

  return { theadHtml, tbodyHtml: rowsHtml };
}

function ScheduleTable({ timeKeys, daySlots, rowspans, nombreCursoDisplay, turno, preceptorNombre }) {
  const visibleTimes = Object.keys(timeKeys).sort((a, b) => a.localeCompare(b));
  const remaining = {};
  DIAS.forEach((d) => { remaining[d] = 0; });
  const colspan = DIAS.length + 1;
  const preceptorTexto = preceptorNombre || '-';

  return (
    <div className="table-responsive">
      <table className="vista-horarios-table">
        <thead>
          <tr className="info-row">
            <th colSpan={colspan}>
              <div className="info-row-inner">
                <span className="info-left">Curso: {nombreCursoDisplay}</span>
                <span className="info-center">Turno: {turno}</span>
                <span className="info-right">Preceptor: {preceptorTexto}</span>
              </div>
            </th>
          </tr>
          <tr>
            <th>Horario</th>
            {DIAS.map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleTimes.map((timeKey) => {
            const [hInicio, hFin] = timeKey.split('_');
            const hasContent = DIAS.some((dia) => {
              const slot = (daySlots[dia] || []).find(
                (s) => s.hora_inicio === hInicio && s.hora_fin === hFin,
              );
              return slot && slot.materia_nombre;
            });

            if (!hasContent) return null;

            return (
              <tr key={timeKey}>
                <td className="vista-horarios-time">{hInicio} – {hFin}</td>
                {DIAS.map((dia) => {
                  if (remaining[dia] > 0) {
                    remaining[dia]--;
                    return null;
                  }
                  const slot = (daySlots[dia] || []).find(
                    (s) => s.hora_inicio === hInicio && s.hora_fin === hFin,
                  );
                  if (!slot) return <td key={dia} />;
                  const rs = rowspans[slot.id] || 1;
                  if (rs === 0) return null;
                  if (rs > 1) remaining[dia] = rs - 1;
                  return (
                    <td
                      key={dia}
                      rowSpan={rs}
                      className={`vista-horarios-cell${slot.tipo === 'especial' ? ' vista-horarios-especial' : ''}`}
                    >
                      {slot.materia_nombre ? (
                        <div>
                          <div className="vista-horarios-materia">{slot.materia_nombre}</div>
                          <div className="vista-horarios-docente">{slot.docente_nombre || '-'}</div>
                          {slot.aula && (
                            <div className="vista-horarios-aula">{slot.aula}</div>
                          )}
                          {slot.suplentes?.length > 0 && (
                            <div className="vista-horarios-suplentes">
                              {slot.suplentes.map((sp) => (
                                <div key={sp.key} className="vista-horarios-suplente">
                                  <span className="vista-horarios-suplente-label">
                                    {sp.nivel > 1 ? `Suplente nivel ${sp.nivel}` : 'Suplente'}
                                  </span>
                                  {sp.nombre ? ` ${sp.nombre}` : ' —'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VistaHorarios({ cursosOptions, cursoForzado }) {
  const { modulos } = useData();
  const [cursoSeleccionado, setCursoSeleccionado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [daySlots, setDaySlots] = useState({});
  const [timeKeys, setTimeKeys] = useState({});
  const [rowspans, setRowspans] = useState({});
  const [cursoNombre, setCursoNombre] = useState('');
  const [nombreCursoDisplay, setNombreCursoDisplay] = useState('');
  const [turno, setTurno] = useState('');
  const [preceptorNombre, setPreceptorNombre] = useState(null);
  const [adelantos, setAdelantos] = useState([]);

  const modulosSorted = useMemo(() => {
    if (!Array.isArray(modulos)) return [];
    return [...modulos].sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
  }, [modulos]);

  useEffect(() => {
    if (cursoForzado) {
      setCursoSeleccionado(String(cursoForzado));
    }
  }, [cursoForzado]);

  useEffect(() => {
    if (!cursoSeleccionado) {
      setDaySlots({});
      setTimeKeys({});
      setRowspans({});
      setCursoNombre('');
      setNombreCursoDisplay('');
      setTurno('');
      setPreceptorNombre(null);
      setAdelantos([]);
      return;
    }
    setCargando(true);
    const cursoObj = cursosOptions.find((c) => String(c.id_curso) === String(cursoSeleccionado));
    setCursoNombre(cursoObj?.nombre_curso || '');
    const orientacion = cursoObj?.orientacion;
    setNombreCursoDisplay(orientacion ? `${cursoObj?.nombre_curso} - ${orientacion}` : (cursoObj?.nombre_curso || ''));
    setPreceptorNombre(obtenerPreceptorNombre(cursoObj));
    Promise.all([
      getCursoMateria({ curso: cursoSeleccionado }),
      getHorarios({ curso: cursoSeleccionado }),
      getHorariosEspeciales({ curso: cursoSeleccionado }),
      getSuplencias({ curso: cursoSeleccionado }),
      getAdelantosHoras({ curso: cursoSeleccionado, estado: 1 }),
    ])
      .then(([cmData, horData, heData, spData, adData]) => {
        const cmList = Array.isArray(cmData) ? cmData : cmData.results || [];
        const horList = Array.isArray(horData) ? horData : horData.results || [];
        const heList = Array.isArray(heData) ? heData : heData.results || [];
        const spList = Array.isArray(spData) ? spData : spData.results || [];
        const adList = Array.isArray(adData) ? adData : adData.results || [];
        setAdelantos(adList);

        const materiasLookup = {};
        const docentesLookup = {};
        cmList.forEach((cm) => {
          if (cm.id_curso_materia && cm.materia_nombre) {
            materiasLookup[cm.id_curso_materia] = cm.materia_nombre;
          }
          if (cm.id_curso_materia) {
            docentesLookup[cm.id_curso_materia] = cm.docente_nombre || null;
          }
        });

        setTurno(calcularTurno(horList));

        const { daySlots: ds, allTimes } = buildTimeSlots(
          modulosSorted,
          heList,
          horList,
          materiasLookup,
          docentesLookup,
          suplenciasActivasLista(spList),
        );
        setDaySlots(ds);
        setTimeKeys(allTimes);
        setRowspans(computeRowspans(ds));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [cursoSeleccionado, modulosSorted, cursosOptions]);

  const descargarPDF = useCallback(() => {
    const { theadHtml, tbodyHtml } = buildRowsHtml(daySlots, timeKeys, rowspans, nombreCursoDisplay, turno, preceptorNombre);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Horario - ${cursoNombre}</title>
<style>
  @page { size: landscape; margin: 15mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; }
  th, td { border: 1px solid #333; padding: 8px 6px; text-align: center; vertical-align: middle; font-size: 12px; overflow-wrap: break-word; word-wrap: break-word; }
  th:first-child, td:first-child { width: 110px; }
  th { background: #17324d; color: #fff; font-weight: 700; }
  .time-col { font-weight: 600; white-space: nowrap; }
  .materia { font-weight: 600; }
  .docente { font-size: 10px; color: #666; margin-top: 2px; }
  .aula { font-size: 10px; color: #666; margin-top: 2px; }
  .suplente { font-size: 10px; color: #3498db; font-style: italic; margin-top: 2px; }
  .suplente-label { font-weight: 600; }
  .especial { background: #fff8f0; }
  .info-row th { background: #f5f5f5; color: #333; font-weight: 600; padding: 10px 16px; }
  .info-row-inner { display: flex; justify-content: space-between; width: 100%; }
  .info-left { text-align: left; }
  .info-center { text-align: center; }
  .info-right { text-align: right; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<table>
<thead>${theadHtml}</thead>
<tbody>${tbodyHtml}</tbody>
</table>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '-9999px';
    iframe.style.bottom = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  }, [daySlots, timeKeys, rowspans, nombreCursoDisplay, turno, preceptorNombre]);

  const hasData = Object.keys(timeKeys).length > 0;

  return (
    <div>
      {!cursoForzado && (
        <div className="filter-row">
          <div className="form-group-filter" style={{ maxWidth: '320px' }}>
            <label htmlFor="vh-curso">Curso</label>
            <select
              id="vh-curso"
              value={cursoSeleccionado}
              onChange={(e) => setCursoSeleccionado(e.target.value)}
            >
              <option value="">— Seleccionar curso —</option>
              {cursosOptions.map((c) => (
                <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {cargando && (
        <LoadingSpinner text="Cargando horarios..." size="sm" inline />
      )}

      {!cargando && cursoSeleccionado && !hasData && (
        <p className="empty-state-message empty-state-centered">
          No hay horarios cargados para este curso.
        </p>
      )}

      {hasData && !cargando && (
        <div>
          <div className="form-actions mb-16">
            <button type="button" className="btn btn-primary" onClick={descargarPDF}>
              <i className="fas fa-download" aria-hidden="true" /> Descargar PDF
            </button>
          </div>

          <ScheduleTable
            timeKeys={timeKeys}
            daySlots={daySlots}
            rowspans={rowspans}
            nombreCursoDisplay={nombreCursoDisplay}
            turno={turno}
            preceptorNombre={preceptorNombre}
          />

          {adelantos.length > 0 && (
            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-header">
                <h3 className="m-0">Adelantos de horas del curso</h3>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Materia</th>
                        <th>Docente</th>
                        <th>Fecha</th>
                        <th>Horario</th>
                        <th>Horario original</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adelantos.map((a) => (
                        <tr key={a.id_adelanto}>
                          <td>
                            <span className="badge badge-warning" style={{ marginRight: '6px' }}>Adelanto de horas</span>
                            {a.materia_nombre || '—'}
                          </td>
                          <td>{a.docente_nombre || '—'}</td>
                          <td>{a.fecha_adelanto || '—'}</td>
                          <td>
                            {a.hora_inicio ? `${String(a.hora_inicio).slice(0, 5)} a ${String(a.hora_fin).slice(0, 5)}` : '—'}
                          </td>
                          <td>
                            <span className={`badge ${a.mantener_horario_original ? 'badge-success' : 'badge-warning'}`}>
                              {a.mantener_horario_original ? 'Se mantiene' : 'Cancelado'}
                            </span>
                          </td>
                          <td>{a.motivo || '—'}</td>
                          <td>
                            {!a.estado ? (
                              <span className="badge badge-neutral">Eliminado</span>
                            ) : a.finalizado ? (
                              <span className="badge badge-neutral">Finalizado</span>
                            ) : (
                              <span className="badge badge-success">Activo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VistaHorarios;
