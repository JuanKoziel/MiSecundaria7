import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import Notificaciones from './Notificaciones'
import { useData } from '../context/DataContext'

vi.mock('../context/DataContext', () => ({
  useData: vi.fn(),
}))

const baseNotifs = [
  {
    id: 1,
    id_usuario: 10,
    id_alumno: 100,
    titulo: 'Nueva calificación',
    mensaje: 'Tu calificación fue cargada.',
    fecha: '2026-09-01T10:30:00Z',
    leida: false,
  },
  {
    id: 2,
    id_usuario: 10,
    id_alumno: 100,
    titulo: 'Aviso general',
    mensaje: 'Jornada institucional.',
    fecha: '2026-08-30T08:00:00Z',
    leida: true,
  },
]

function mockUseData(overrides = {}) {
  const marcarNotificacionLeida = vi.fn().mockResolvedValue(true)
  const marcarTodasNotificacionesLeidas = vi.fn().mockResolvedValue(true)
  useData.mockReturnValue({
    notificaciones: baseNotifs,
    loading: false,
    error: null,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    ...overrides,
  })
  return { marcarNotificacionLeida, marcarTodasNotificacionesLeidas }
}

describe('Notificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseData()
  })

  it('muestra título, mensaje y fecha de cada notificación', () => {
    render(<Notificaciones />)
    expect(screen.getByText('Nueva calificación')).toBeInTheDocument()
    expect(screen.getByText('Tu calificación fue cargada.')).toBeInTheDocument()
    expect(screen.getByText('Aviso general')).toBeInTheDocument()
  })

  it('marca como leída al hacer click en el botón individual', () => {
    const { marcarNotificacionLeida } = mockUseData()
    render(<Notificaciones />)
    const btn = screen.getByRole('button', { name: /Marcar como leída/ })
    fireEvent.click(btn)
    expect(marcarNotificacionLeida).toHaveBeenCalledTimes(1)
  })

  it('muestra contador de no leídas y botón de marcar todas', () => {
    render(<Notificaciones />)
    expect(screen.getByText('1 sin leer')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Marcar todas como leídas/ }),
    ).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay notificaciones', () => {
    mockUseData({ notificaciones: [] })
    render(<Notificaciones />)
    expect(screen.getByText('No hay notificaciones disponibles.')).toBeInTheDocument()
  })

  it('muestra estado de carga mientras loading', () => {
    mockUseData({ loading: true })
    render(<Notificaciones />)
    expect(screen.getByText('Cargando notificaciones…')).toBeInTheDocument()
  })

  it('para familia filtra por el hijo seleccionado', () => {
    render(<Notificaciones userRole="familia" selectedChild={{ id: 1, alumnoId: 100, nombre: 'Lucas' }} />)
    expect(screen.getByText('Nueva calificación')).toBeInTheDocument()
    expect(screen.getByText('Aviso general')).toBeInTheDocument()
  })

  it('para familia no muestra notificaciones de otro hijo', () => {
    render(<Notificaciones userRole="familia" selectedChild={{ id: 2, alumnoId: 200, nombre: 'Sofi' }} />)
    expect(screen.queryByText('Nueva calificación')).not.toBeInTheDocument()
    expect(
      screen.getByText('No hay notificaciones disponibles para Sofi.'),
    ).toBeInTheDocument()
  })

  it('para familia sin hijo seleccionado pide elegir un estudiante', () => {
    render(<Notificaciones userRole="familia" selectedChild={null} />)
    expect(
      screen.getByText('Seleccioná un estudiante para ver sus notificaciones.'),
    ).toBeInTheDocument()
  })

  it('para familia la pestaña Personales muestra solo id_alumno nulo', () => {
    mockUseData({
      notificaciones: [
        ...baseNotifs,
        { id: 3, id_usuario: 10, id_alumno: null, titulo: 'Personal', mensaje: 'Para vos', fecha: '2026-09-01T00:00:00Z', leida: false },
      ],
    })
    render(<Notificaciones userRole="familia" selectedChild={{ id: 1, alumnoId: 100, nombre: 'Lucas' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Personales' }))
    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.queryByText('Nueva calificación')).not.toBeInTheDocument()
  })

  it('llama a marcarTodasNotificacionesLeidas al hacer click en marcar todas', () => {
    const { marcarTodasNotificacionesLeidas } = mockUseData()
    render(<Notificaciones />)
    fireEvent.click(screen.getByRole('button', { name: /Marcar todas como leídas/ }))
    expect(marcarTodasNotificacionesLeidas).toHaveBeenCalledTimes(1)
  })

  it('propaga destino y params SEMANTICOS al navegar (sin premapear)', () => {
    const navegarDesdeNotificacion = vi.fn()
    mockUseData({
      notificaciones: [
        {
          id: 9,
          id_usuario: 10,
          id_alumno: 100,
          titulo: 'Evento institucional',
          mensaje: 'Jornada institucional el 05/09/2026',
          fecha: '2026-09-01T10:30:00Z',
          leida: false,
          nav_destino: 'eventos',
          nav_params: { eventoId: 3 },
        },
      ],
      navegarDesdeNotificacion,
    })
    render(<Notificaciones userRole="alumno" />)
    fireEvent.click(screen.getByText('Evento institucional'))
    expect(navegarDesdeNotificacion).toHaveBeenCalledWith('eventos', { eventoId: 3 })
  })

  it('no navega si la notificacion no tiene nav_destino', () => {
    const navegarDesdeNotificacion = vi.fn()
    mockUseData({ navegarDesdeNotificacion })
    render(<Notificaciones />)
    fireEvent.click(screen.getByText('Nueva calificación'))
    expect(navegarDesdeNotificacion).not.toHaveBeenCalled()
  })

  it('no muestra "Ver" ni navega si el rol no tiene una vista real para el destino', () => {
    const navegarDesdeNotificacion = vi.fn()
    mockUseData({
      notificaciones: [
        {
          id: 14,
          id_usuario: 10,
          id_alumno: null,
          titulo: 'Adelanto aprobado',
          mensaje: 'Se aprobó un adelanto de horas.',
          fecha: '2026-09-01T10:30:00Z',
          leida: true,
          nav_destino: 'adelantos',
          nav_params: { adelantoId: 1 },
        },
      ],
      navegarDesdeNotificacion,
    })
    // El rol docente NO tiene apartado de adelantos: no debe verse "Ver" ni
    // comportarse como botón navegable aunque exista nav_destino.
    render(<Notificaciones userRole="docente" />)
    expect(screen.queryByText('Ver')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Adelanto aprobado'))
    expect(navegarDesdeNotificacion).not.toHaveBeenCalled()
  })

  it('muestra "Ver" y navega si el rol tiene una vista real para el destino', () => {
    const navegarDesdeNotificacion = vi.fn()
    mockUseData({
      notificaciones: [
        {
          id: 15,
          id_usuario: 10,
          id_alumno: null,
          titulo: 'Acta cargada',
          mensaje: 'Se registró un acta de conducta.',
          fecha: '2026-09-01T10:30:00Z',
          leida: false,
          nav_destino: 'actas',
          nav_params: {},
        },
      ],
      navegarDesdeNotificacion,
    })
    // jefe_preceptores se resuelve al mapa de preceptor, que SÍ tiene 'actas'.
    render(<Notificaciones userRole="jefe_preceptores" />)
    expect(screen.getByText('Ver')).toBeInTheDocument()
    const tarjeta = screen.getByRole('button', { name: /Acta cargada/ })
    fireEvent.click(tarjeta)
    expect(navegarDesdeNotificacion).toHaveBeenCalledWith('actas', {})
  })

  it('muestra la tarjeta como botón con indicador "Ver →" y navega al hacer clic', () => {
    const navegarDesdeNotificacion = vi.fn()
    mockUseData({
      notificaciones: [
        {
          id: 10,
          id_usuario: 10,
          id_alumno: 100,
          titulo: 'Evento institucional',
          mensaje: 'Jornada institucional el 05/09/2026',
          fecha: '2026-09-01T10:30:00Z',
          leida: true,
          nav_destino: 'eventos',
          nav_params: { eventoId: 3 },
        },
      ],
      navegarDesdeNotificacion,
    })
    render(<Notificaciones userRole="alumno" />)
    const tarjeta = screen.getByRole('button', { name: /Evento institucional/ })
    expect(tarjeta).toHaveAttribute('role', 'button')
    expect(screen.getByText('Ver')).toBeInTheDocument()
    fireEvent.click(tarjeta)
    expect(navegarDesdeNotificacion).toHaveBeenCalledWith('eventos', { eventoId: 3 })
  })

  it('activa la navegación con Enter y con Space desde teclado', () => {
    const navegarDesdeNotificacion = vi.fn()
    mockUseData({
      notificaciones: [
        {
          id: 11,
          id_usuario: 10,
          id_alumno: 100,
          titulo: 'Evento institucional',
          mensaje: 'Jornada institucional',
          fecha: '2026-09-01T10:30:00Z',
          leida: true,
          nav_destino: 'eventos',
          nav_params: { eventoId: 3 },
        },
      ],
      navegarDesdeNotificacion,
    })
    render(<Notificaciones userRole="alumno" />)
    const tarjeta = screen.getByRole('button', { name: /Evento institucional/ })

    fireEvent.keyDown(tarjeta, { key: 'Enter', code: 13 })
    fireEvent.keyDown(tarjeta, { key: ' ', code: 32 })
    expect(navegarDesdeNotificacion).toHaveBeenCalledTimes(2)
  })

  it('"Marcar como leída" no dispara la navegación de la tarjeta (stopPropagation)', () => {
    const navegarDesdeNotificacion = vi.fn()
    const { marcarNotificacionLeida } = mockUseData({
      notificaciones: [
        {
          id: 12,
          id_usuario: 10,
          id_alumno: 100,
          titulo: 'Evento institucional',
          mensaje: 'Jornada institucional',
          fecha: '2026-09-01T10:30:00Z',
          leida: false,
          nav_destino: 'eventos',
          nav_params: { eventoId: 3 },
        },
      ],
      navegarDesdeNotificacion,
    })
    render(<Notificaciones userRole="alumno" />)
    fireEvent.click(screen.getByRole('button', { name: /Marcar como leída/ }))
    expect(marcarNotificacionLeida).toHaveBeenCalledTimes(1)
    expect(navegarDesdeNotificacion).not.toHaveBeenCalled()
  })

  it('no expone metadata interna [nav:]/[ref:] al usuario', () => {
    mockUseData({
      notificaciones: [
        {
          id: 13,
          id_usuario: 10,
          id_alumno: 100,
          titulo: 'Evento institucional',
          mensaje: 'Jornada institucional el 05/09/2026',
          fecha: '2026-09-01T10:30:00Z',
          leida: true,
          nav_destino: 'eventos',
          nav_params: { eventoId: 3 },
        },
      ],
    })
    render(<Notificaciones />)
    // El mensaje visible es solo el texto; los metadatos llegan como campos
    // separados (nav_destino/nav_params) y nunca se inlinean en el UI.
    expect(screen.queryByText(/\[nav:/, { selector: '*' })).toBeNull()
    expect(screen.queryByText(/\[ref:/, { selector: '*' })).toBeNull()
    expect(screen.queryByText(/eventoId/)).toBeNull()
    expect(screen.getByText(/Jornada institucional el 05\/09\/2026/)).toBeInTheDocument()
  })
})
