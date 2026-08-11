import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDeleteModal from './ConfirmDeleteModal'

describe('ConfirmDeleteModal', () => {
  it('no renderiza nada cuando está cerrado', () => {
    const { container } = render(
      <ConfirmDeleteModal open={false} onConfirm={() => {}} onCancel={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra título, mensaje y nota por defecto', () => {
    render(<ConfirmDeleteModal open onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(
      screen.getByText('¿Está seguro de que desea eliminar este registro?'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Esta acción ocultará el registro del sistema.'),
    ).toBeInTheDocument()
  })

  it('permite personalizar textos', () => {
    render(
      <ConfirmDeleteModal
        open
        title="Confirmar baja"
        message="¿Eliminar la materia?"
        note="No se podrá revertir."
        confirmText="Sí, eliminar"
        cancelText="Volver"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByText('Confirmar baja')).toBeInTheDocument()
    expect(screen.getByText('¿Eliminar la materia?')).toBeInTheDocument()
    expect(screen.getByText('No se podrá revertir.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sí, eliminar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })

  it('omite la nota si se pasa null', () => {
    const { container } = render(
      <ConfirmDeleteModal open note={null} onConfirm={() => {}} onCancel={() => {}} />,
    )
    expect(container.querySelector('.confirm-modal__note')).toBeNull()
  })

  it('llama a onConfirm al clickear el botón de eliminar', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDeleteModal open onConfirm={onConfirm} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('llama a onCancel al clickear cancelar', () => {
    const onCancel = vi.fn()
    render(<ConfirmDeleteModal open onConfirm={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('confirma con la tecla Enter', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDeleteModal open onConfirm={onConfirm} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('cancela con la tecla Escape', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDeleteModal open onConfirm={onConfirm} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cancela al hacer click en el overlay', () => {
    const onCancel = vi.fn()
    const { container } = render(
      <ConfirmDeleteModal open onConfirm={() => {}} onCancel={onCancel} />,
    )
    fireEvent.mouseDown(container.querySelector('.ddjj-modal-overlay'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('deshabilita los botones y muestra el texto de carga mientras loading', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDeleteModal open loading loadingText="Eliminando..." onConfirm={onConfirm} onCancel={onCancel} />,
    )
    expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })
})
