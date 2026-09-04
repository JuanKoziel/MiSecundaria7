import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

const hook = vi.hoisted(() => ({
  state: {
    notificaciones: [],
    campanaPulse: 0,
    nuevasNotificaciones: [],
    descartarNueva: vi.fn(),
    navegarDesdeNotificacion: vi.fn(),
  },
}))

vi.mock('../context/DataContext', () => ({
  useData: () => hook.state,
}))

import CampanaNotificaciones from './Shared/CampanaNotificaciones'
import NotificacionToast from './Shared/NotificacionToast'

function usarFakeTimers() {
  afterEach(() => vi.useRealTimers())
}

describe('CampanaNotificaciones (badge de campana - Parte 1/4)', () => {
  beforeEach(() => {
    hook.state.notificaciones = []
    hook.state.campanaPulse = 0
  })

  it('muestra el contador de notificaciones sin leer', () => {
    hook.state.notificaciones = [
      { id: 1, leida: false },
      { id: 2, leida: true },
      { id: 3, leida: false },
    ]
    render(<CampanaNotificaciones />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('no muestra badge cuando no hay sin leer', () => {
    hook.state.notificaciones = [{ id: 1, leida: true }, { id: 2, leida: true }]
    render(<CampanaNotificaciones />)
    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('limita la cifra a 99+ para evitar desbordes', () => {
    hook.state.notificaciones = Array.from({ length: 120 }, (_, i) => ({ id: i, leida: false }))
    render(<CampanaNotificaciones />)
    // El badge es aria-hidden; el texto accesible anuncia el total real.
    expect(screen.getByText('120 notificaciones sin leer')).toBeInTheDocument()
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('reacciona a un nuevo pulso (nueva notificacion en sesion) sin error', () => {
    hook.state.notificaciones = [{ id: 1, leida: false }]
    hook.state.campanaPulse = 3
    render(<CampanaNotificaciones />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})

describe('NotificacionToast (toast "Nueva notificación" - Partes 2,3,5,7,8)', () => {
  usarFakeTimers()

  beforeEach(() => {
    hook.state.nuevasNotificaciones = []
    hook.state.descartarNueva.mockClear()
    hook.state.navegarDesdeNotificacion.mockClear()
  })

  it('no renderiza nada si no hay notificaciones nuevas en sesion', () => {
    hook.state.nuevasNotificaciones = []
    render(<NotificacionToast userRole="alumno" />)
    expect(screen.queryByText('Nueva notificación')).toBeNull()
  })

  it('muestra titulo y mensaje de la nueva', () => {
    hook.state.nuevasNotificaciones = [
      { id: 11, titulo: 'Boletin disponible', mensaje: 'Tu boletin ya esta listo.', leida: false },
    ]
    render(<NotificacionToast userRole="alumno" />)
    expect(screen.getByText('Nueva notificación')).toBeInTheDocument()
    expect(screen.getByText('Boletin disponible')).toBeInTheDocument()
    expect(screen.getByText('Tu boletin ya esta listo.')).toBeInTheDocument()
  })

  it('muestra boton "Ver" cuando el rol tiene vista para el destino', () => {
    hook.state.nuevasNotificaciones = [
      { id: 12, titulo: 'Comunicado', mensaje: '', leida: false, nav_destino: 'calificaciones', nav_params: {} },
    ]
    render(<NotificacionToast userRole="alumno" />)
    expect(screen.getByText(/Ver/)).toBeInTheDocument()
  })

  it('NO muestra "Ver" cuando el rol no tiene vista para el destino', () => {
    hook.state.nuevasNotificaciones = [
      { id: 13, titulo: 'Adelanto', mensaje: '', leida: false, nav_destino: 'adelantos', nav_params: {} },
    ]
    // docente no tiene apartado de adelantos
    render(<NotificacionToast userRole="docente" />)
    expect(screen.queryByText(/Ver/)).toBeNull()
  })

  it('NO muestra "Ver" si no hay nav_destino', () => {
    hook.state.nuevasNotificaciones = [
      { id: 14, titulo: 'Hola', mensaje: '', leida: false, nav_destino: null, nav_params: {} },
    ]
    render(<NotificacionToast userRole="alumno" />)
    expect(screen.queryByText(/Ver/)).toBeNull()
  })

  it('cerrar llama a descartarNueva con el id', async () => {
    hook.state.nuevasNotificaciones = [{ id: 15, titulo: 'X', mensaje: '', leida: false }]
    render(<NotificacionToast userRole="alumno" />)
    fireEvent.click(screen.getByLabelText('Cerrar notificación'))
    // El cierre ejecuta onCerrar tras la animación de salida (SALIDA_MS=300ms).
    await new Promise((r) => setTimeout(r, 350))
    expect(hook.state.descartarNueva).toHaveBeenCalledWith(15)
  })

  it('"Ver" descarta y navega al destino existente', () => {
    hook.state.nuevasNotificaciones = [
      { id: 16, titulo: 'Evento', mensaje: '', leida: false, nav_destino: 'eventos', nav_params: {} },
    ]
    render(<NotificacionToast userRole="alumno" />)
    fireEvent.click(screen.getByText(/Ver/))
    expect(hook.state.descartarNueva).toHaveBeenCalledWith(16)
    expect(hook.state.navegarDesdeNotificacion).toHaveBeenCalledWith('eventos', {})
  })
})