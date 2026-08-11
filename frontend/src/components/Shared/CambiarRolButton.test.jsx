import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CambiarRolButton from './CambiarRolButton'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('CambiarRolButton', () => {
  it('no renderiza nada si el usuario tiene menos de dos roles', () => {
    useAuth.mockReturnValue({ user: { roles: ['docente'] }, cambiarRol: vi.fn() })
    const { container } = render(<CambiarRolButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it('no renderiza nada si el usuario no tiene roles', () => {
    useAuth.mockReturnValue({ user: { roles: [] }, cambiarRol: vi.fn() })
    const { container } = render(<CambiarRolButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el botón y llama a cambiarRol al clickear', () => {
    const cambiarRol = vi.fn()
    useAuth.mockReturnValue({
      user: { roles: ['preceptor', 'docente'] },
      cambiarRol,
    })
    render(<CambiarRolButton />)
    const boton = screen.getByRole('button', { name: /Cambiar rol/ })
    fireEvent.click(boton)
    expect(cambiarRol).toHaveBeenCalledTimes(1)
  })
})
