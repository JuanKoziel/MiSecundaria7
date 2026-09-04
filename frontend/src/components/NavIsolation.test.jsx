import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useState, useEffect } from 'react'
import { DataProvider, useData } from '../context/DataContext'
import Notificaciones from './Notificaciones'
import { viewDesdeDestino } from '../utils/navDestinos'

const api = vi.hoisted(() => ({
  getAlumnos: vi.fn(),
  getDocentes: vi.fn(),
  getPreceptores: vi.fn(),
  getCursos: vi.fn(),
  getMaterias: vi.fn(),
  getCursoMateria: vi.fn(),
  getCalificaciones: vi.fn(),
  getAsistencias: vi.fn(),
  getActas: vi.fn(),
  getActaAlumno: vi.fn(),
  getActaCurso: vi.fn(),
  getActaDocente: vi.fn(),
  getHorarios: vi.fn(),
  getModulos: vi.fn(),
  getCiclosLectivos: vi.fn(),
  getEstadosAsistencia: vi.fn(),
  getNotificaciones: vi.fn(),
  getInscripciones: vi.fn(),
  getPadresTutores: vi.fn(),
  getPeriodos: vi.fn(),
  getComunicados: vi.fn(),
  getDiagnosticosGrupales: vi.fn(),
  getPlanificaciones: vi.fn(),
  marcarLeida: vi.fn(),
  marcarTodasLeidas: vi.fn(),
}))

vi.mock('../services/api', () => api)

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset())
  const empty = []
  api.getAlumnos.mockResolvedValue([])
  api.getDocentes.mockResolvedValue([])
  api.getPreceptores.mockResolvedValue([])
  api.getCursos.mockResolvedValue([])
  api.getMaterias.mockResolvedValue([])
  api.getCursoMateria.mockResolvedValue([])
  api.getCalificaciones.mockResolvedValue([])
  api.getAsistencias.mockResolvedValue([])
  api.getActas.mockResolvedValue([])
  api.getActaAlumno.mockResolvedValue([])
  api.getActaCurso.mockResolvedValue([])
  api.getActaDocente.mockResolvedValue([])
  api.getHorarios.mockResolvedValue(empty)
  api.getModulos.mockResolvedValue([])
  api.getCiclosLectivos.mockResolvedValue([])
  api.getEstadosAsistencia.mockResolvedValue([])
  api.getNotificaciones.mockResolvedValue([])
  api.getInscripciones.mockResolvedValue([])
  api.getPadresTutores.mockResolvedValue([])
  api.getPeriodos.mockResolvedValue([])
  api.getComunicados.mockResolvedValue([])
  api.getDiagnosticosGrupales.mockResolvedValue([])
  api.getPlanificaciones.mockResolvedValue([])
  api.marcarLeida.mockResolvedValue({})
  api.marcarTodasLeidas.mockResolvedValue({})
})

// Harness que replica EXACTAMENTE el useEffect de navegación que usa cada
// dashboard real (el mismo `useData().navIntent` + `viewDesdeDestino` + el
// setter de la sección), y renderiza la vista en un testid identificable.
function Harness({ userRole, rolInterno }) {
  const { navIntent } = useData()
  const [view, setView] = useState('perfil')

  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, rolInterno)
      if (vista) setView(vista)
    }
  }, [navIntent])

  return (
    <div>
      <div data-testid={`seccion-${userRole}`} data-view={view}>
        {view === 'perfil' ? 'PERFIL' : `SECCION:${view}`}
      </div>
      <Notificaciones userRole={userRole} />
    </div>
  )
}

// Replica el flujo REAL de FamiliaDashboard: además de cambiar la vista,
// selecciona el hijo indicado por `params.alumnoId`.
function HarnessFamilia() {
  const { navIntent } = useData()
  const [view, setView] = useState('perfil')
  const [hijoAlumnoId, setHijoAlumnoId] = useState(null)

  useEffect(() => {
    if (navIntent && navIntent.destino) {
      const vista = viewDesdeDestino(navIntent.destino, 'familia')
      if (!vista) return
      setView(vista)
      const alumnoId = navIntent.params?.alumnoId
      if (alumnoId != null) setHijoAlumnoId(Number(alumnoId))
    }
  }, [navIntent])

  return (
    <div>
      <div data-testid="seccion-familia" data-view={view} data-hijo={hijoAlumnoId}>
        {view === 'perfil' ? 'PERFIL' : `SECCION:${view}`}
      </div>
      <Notificaciones userRole="familia" selectedChild={{ id: 1, alumnoId: 123, nombre: 'Lucas' }} />
    </div>
  )
}

function Wrapped({ userRole, rolInterno, notif }) {
  return (
    <DataProvider>
      <Harness userRole={userRole} rolInterno={rolInterno} />
    </DataProvider>
  )
}

async function ajudarNavegacion(userRole, rolInterno, notif) {
  if (notif) api.getNotificaciones.mockResolvedValue([notif])
  render(<Wrapped userRole={userRole} rolInterno={rolInterno} notif={notif} />)
  await waitFor(() => expect(screen.getByText(notif.titulo)).toBeInTheDocument())
  const tarjeta = screen.getByText(notif.titulo)
  fireEvent.click(tarjeta)
}

let c = 0
function navNotif(destino) {
  c += 1
  return {
    id_notificacion: 100 + c,
    id_usuario: 10,
    id_alumno: null,
    titulo: `Aviso ${destino}`,
    mensaje: `Contenido navegable ${destino}`,
    fecha: '2026-09-01T10:30:00Z',
    leida: false,
    nav_destino: destino,
    nav_params: {},
  }
}

function navyFamilia() {
  c += 1
  return {
    id_notificacion: 200 + c,
    id_usuario: 10,
    id_alumno: 123,
    titulo: 'Calificación cargada',
    mensaje: 'Nueva calificación para tu hijo.',
    fecha: '2026-09-01T10:30:00Z',
    leida: false,
    nav_destino: 'calificaciones',
    nav_params: { alumnoId: 123 },
  }
}

describe('Aislamiento: notificacion real -> navIntent -> useData -> setView (todos los roles)', () => {
  const casos = [
    { userRole: 'alumno', rolInterno: 'alumno', destino: 'comunicados', espera: 'comunicados' },
    { userRole: 'preceptor', rolInterno: 'preceptor', destino: 'actas', espera: 'actas' },
    { userRole: 'jefe_preceptores', rolInterno: 'preceptor', destino: 'actas', espera: 'actas' },
    { userRole: 'docente', rolInterno: 'docente', destino: 'comunicados', espera: 'comunicados' },
    { userRole: 'admin', rolInterno: 'admin', destino: 'suplencias', espera: 'suplencias' },
    { userRole: 'director', rolInterno: 'admin', destino: 'comunicados', espera: 'comunicados' },
  ]

  for (const cs of casos) {
    it(`[${cs.userRole}] rol con vista navega a ${cs.espera}`, async () => {
      await ajudarNavegacion(cs.userRole, cs.rolInterno, navNotif(cs.destino))
      await waitFor(() => {
        expect(
          screen.getByTestId(`seccion-${cs.userRole}`).getAttribute('data-view'),
        ).toBe(cs.espera)
      })
    })
  }

  it('rol sin vista para el destino NO navega (ni siquiera dispara el efecto)', async () => {
    // docente no tiene apartado de adelantos -> no debe cambiar de seccion
    await ajudarNavegacion('docente', 'docente', navNotif('adelantos'))
    await waitFor(() => expect(screen.getByText(/SECCION:perfil|PERFIL/)).toBeInTheDocument())
    // pequena espera para descartar cambio tardio
    await new Promise((r) => setTimeout(r, 80))
    expect(screen.getByTestId('seccion-docente').getAttribute('data-view')).toBe('perfil')
  })

  it('[familia] navega a la vista y fija el Estudiante correcto por params.alumnoId', async () => {
    const n = navyFamilia()
    api.getNotificaciones.mockResolvedValue([n])
    render(
      <DataProvider>
        <HarnessFamilia />
      </DataProvider>,
    )
    await waitFor(() => expect(screen.getByText(n.titulo)).toBeInTheDocument())
    fireEvent.click(screen.getByText(n.titulo))

    await waitFor(() => {
      const el = screen.getByTestId('seccion-familia')
      expect(el.getAttribute('data-view')).toBe('calificaciones')
      expect(el.getAttribute('data-hijo')).toBe('123')
    })
  })
})
