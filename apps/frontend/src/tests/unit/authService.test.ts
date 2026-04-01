import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '../../api/auth.api'
import * as roleService from '../../services/role.service'
import * as tokenService from '../../services/token.service'
import { authService } from '../../services/auth.service'
import type { LoginResponse, UserRole } from '../../types/user'

vi.mock('../../api/auth.api')
vi.mock('../../services/token.service')
vi.mock('../../services/role.service')

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('salvează token și rol după login reușit — accesul la aplicație este controlat prin rol', async () => {
    const mockResponse: LoginResponse = { accessToken: 'test-token', role: 'CUSTOMER' as UserRole }
    vi.spyOn(authApi, 'login').mockResolvedValue(mockResponse)
    const saveToken = vi.spyOn(tokenService.tokenService, 'saveToken').mockImplementation(() => {})
    const saveRole  = vi.spyOn(roleService.roleService, 'saveRole').mockImplementation(() => {})

    await authService.login({ email: 'test@test.com', password: 'parola123' })

    expect(saveToken).toHaveBeenCalledWith('test-token')
    expect(saveRole).toHaveBeenCalledWith('CUSTOMER')
  })
})
