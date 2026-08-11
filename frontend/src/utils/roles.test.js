import { describe, expect, it } from 'vitest'
import { ROLE_INFO, getRoleInfo } from './roles'

describe('getRoleInfo', () => {
  it('devuelve la info de un rol conocido', () => {
    const info = getRoleInfo('preceptor')
    expect(info).toEqual({
      label: 'Preceptor',
      icon: 'fa-clipboard-user',
    })
  })

  it('tiene info para todos los roles del sistema', () => {
    const roles = [
      'admin',
      'director',
      'jefe_preceptores',
      'preceptor',
      'docente',
      'familia',
      'alumno',
    ]
    roles.forEach((rol) => {
      expect(ROLE_INFO[rol]).toBeDefined()
      expect(getRoleInfo(rol).label).not.toBe(rol)
    })
  })

  it('cae en un fallback para roles desconocidos', () => {
    const info = getRoleInfo('super_rol')
    expect(info).toEqual({ label: 'super_rol', icon: 'fa-user-circle' })
  })

  it('usa fallback con "Sin rol" si el rol está vacío', () => {
    const info = getRoleInfo('')
    expect(info.label).toBe('Sin rol')
  })

  it('usa fallback si no se pasa rol', () => {
    const info = getRoleInfo(undefined)
    expect(info.label).toBe('Sin rol')
  })
})
