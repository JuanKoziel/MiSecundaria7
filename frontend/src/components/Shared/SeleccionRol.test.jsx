import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SeleccionRol from './SeleccionRol'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../context/ToastContext', () => ({
  useToast: vi.fn(),
}))

describe('SeleccionRol', () => {
  it('muestra el aviso cuando el usuario no tiene roles', () => {
    const logout = vi.fn()
    useAuth.mockReturnValue({
      user: { username: 'juan', roles: [] },
      seleccionarRol: vi.fn(),
      logout,
    })
    useToast.mockReturnValue({ error: vi.fn() })

    render(<SeleccionRol />)

    expect(screen.getByText(/Tu usuario no tiene ningún rol asignado\./)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('lista los roles disponibles con su etiqueta', () => {
    useAuth.mockReturnValue({
      user: { username: 'juan', roles: ['preceptor', 'docente'] },
      seleccionarRol: vi.fn(),
      logout: vi.fn(),
    })
    useToast.mockReturnValue({ error: vi.fn() })

    render(<SeleccionRol />)

    expect(screen.getByText('Preceptor')).toBeInTheDocument()
    expect(screen.getByText('Docente')).toBeInTheDocument()
    const botones = screen.getAllByText('Ingresar como')
    expect(botones).toHaveLength(2)
  })

  it('llama a seleccionarRol con el rol clickeado', async () => {
    const seleccionarRol = vi.fn(() => Promise.resolve())
    useAuth.mockReturnValue({
      user: { username: 'juan', roles: ['preceptor', 'docente'] },
      seleccionarRol,
      logout: vi.fn(),
    })
    useToast.mockReturnValue({ error: vi.fn() })

    render(<SeleccionRol />)

    fireEvent.click(screen.getByText('Preceptor'))
    expect(seleccionarRol).toHaveBeenCalledWith('preceptor')
    await waitFor(() => expect(screen.getByText('Ingresar como')).toBeInTheDocument())
  })

  it('muestra "Ingresando..." y deshabilita mientras carga', async () => {
    let resolver
    const seleccionarRol = vi.fn(() => new Promise((r) => { resolver = r }))
    useAuth.mockReturnValue({
      user: { username: 'juan', roles: ['preceptor', 'docente'] },
      seleccionarRol,
      logout: vi.fn(),
    })
    useToast.mockReturnValue({ error: vi.fn() })

    render(<SeleccionRol />)

    fireEvent.click(screen.getByText('Preceptor'))

    expect(screen.getByText('Ingresando...')).toBeInTheDocument()
    expect(screen.getByText('Preceptor').closest('button')).toBeDisabled()

    resolver()
    await waitFor(() => expect(screen.getByText('Ingresar como')).toBeInTheDocument())
  })

  it('muestra el error del servidor cuando seleccionarRol falla', async () => {
    const toastError = vi.fn()
    const seleccionarRol = vi.fn(() =>
      Promise.reject({ response: { data: { error: 'Rol no permitido.' } } }),
    )
    useAuth.mockReturnValue({
      user: { username: 'juan', roles: ['preceptor', 'docente'] },
      seleccionarRol,
      logout: vi.fn(),
    })
    useToast.mockReturnValue({ error: toastError })

    render(<SeleccionRol />)

    fireEvent.click(screen.getByText('Preceptor'))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Rol no permitido.'))
  })

  it('usa err.message cuando no hay error de respuesta', async () => {
    const toastError = vi.fn()
    const seleccionarRol = vi.fn(() => Promise.reject(new Error('Red caída.')))
    useAuth.mockReturnValue({
      user: { username: 'juan', roles: ['preceptor'] },
      seleccionarRol,
      logout: vi.fn(),
    })
    useToast.mockReturnValue({ error: toastError })

    render(<SeleccionRol />)

    fireEvent.click(screen.getByText('Preceptor'))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Red caída.'))
  })
})
