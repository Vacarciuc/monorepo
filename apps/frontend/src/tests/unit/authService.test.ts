import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authApi from '../../api/auth.api'
import * as roleService from '../../services/role.service'
import * as tokenService from '../../services/token.service'
import { authService } from '../../services/auth.service'
import type { LoginResponse, UserRole } from '../../types/user'

// Mock the API and storage services
vi.mock('../../api/auth.api')
vi.mock('../../services/token.service')
vi.mock('../../services/role.service')

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('calls login API with correct credentials', async () => {
      const mockResponse: LoginResponse = {
        accessToken: 'test-token',
        role: 'CUSTOMER' as UserRole,
      }
      vi.spyOn(authApi, 'login').mockResolvedValue(mockResponse)
      vi.spyOn(tokenService.tokenService, 'saveToken').mockImplementation(
        () => {},
      )
      vi.spyOn(roleService.roleService, 'saveRole').mockImplementation(() => {})

      const credentials = { email: 'test@example.com', password: 'password123' }
      const result = await authService.login(credentials)

      expect(authApi.login).toHaveBeenCalledWith(credentials)
      expect(result).toEqual(mockResponse)
    })

    it('saves token after successful login', async () => {
      const mockResponse: LoginResponse = {
        accessToken: 'test-token',
        role: 'CUSTOMER' as UserRole,
      }
      vi.spyOn(authApi, 'login').mockResolvedValue(mockResponse)
      const saveTokenSpy = vi
        .spyOn(tokenService.tokenService, 'saveToken')
        .mockImplementation(() => {})
      vi.spyOn(roleService.roleService, 'saveRole').mockImplementation(() => {})

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(saveTokenSpy).toHaveBeenCalledWith('test-token')
    })

    it('saves role after successful login', async () => {
      const mockResponse: LoginResponse = {
        accessToken: 'test-token',
        role: 'CUSTOMER' as UserRole,
      }
      vi.spyOn(authApi, 'login').mockResolvedValue(mockResponse)
      vi.spyOn(tokenService.tokenService, 'saveToken').mockImplementation(
        () => {},
      )
      const saveRoleSpy = vi
        .spyOn(roleService.roleService, 'saveRole')
        .mockImplementation(() => {})

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(saveRoleSpy).toHaveBeenCalledWith('CUSTOMER')
    })

    it('throws error on login failure', async () => {
      const error = new Error('Invalid credentials')
      vi.spyOn(authApi, 'login').mockRejectedValue(error)

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('calls register API with correct data', async () => {
      vi.spyOn(authApi, 'register').mockResolvedValue(undefined)

      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'CUSTOMER' as UserRole,
      }

      await authService.register(registerData)

      expect(authApi.register).toHaveBeenCalledWith(registerData)
    })

    it('throws error on register failure', async () => {
      const error = new Error('Email already exists')
      vi.spyOn(authApi, 'register').mockRejectedValue(error)

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          role: 'CUSTOMER' as UserRole,
        }),
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('logout', () => {
    it('removes token and role', () => {
      const removeTokenSpy = vi
        .spyOn(tokenService.tokenService, 'removeToken')
        .mockImplementation(() => {})
      const removeRoleSpy = vi
        .spyOn(roleService.roleService, 'removeRole')
        .mockImplementation(() => {})

      authService.logout()

      expect(removeTokenSpy).toHaveBeenCalledTimes(1)
      expect(removeRoleSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      vi.spyOn(tokenService.tokenService, 'hasToken').mockReturnValue(true)

      expect(authService.isAuthenticated()).toBe(true)
    })

    it('returns false when token does not exist', () => {
      vi.spyOn(tokenService.tokenService, 'hasToken').mockReturnValue(false)

      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('getAuthHeader', () => {
    it('returns authorization header when token exists', () => {
      vi.spyOn(tokenService.tokenService, 'getToken').mockReturnValue(
        'test-token',
      )

      const header = authService.getAuthHeader()

      expect(header).toEqual({ Authorization: 'Bearer test-token' })
    })

    it('returns empty object when token does not exist', () => {
      vi.spyOn(tokenService.tokenService, 'getToken').mockReturnValue(null)

      const header = authService.getAuthHeader()

      expect(header).toEqual({})
    })
  })

  describe('isAdmin', () => {
    it('returns true when user is admin', () => {
      vi.spyOn(roleService.roleService, 'isAdmin').mockReturnValue(true)

      expect(authService.isAdmin()).toBe(true)
    })

    it('returns false when user is not admin', () => {
      vi.spyOn(roleService.roleService, 'isAdmin').mockReturnValue(false)

      expect(authService.isAdmin()).toBe(false)
    })
  })

  describe('isCustomer', () => {
    it('returns true when user is customer', () => {
      vi.spyOn(roleService.roleService, 'isCustomer').mockReturnValue(true)

      expect(authService.isCustomer()).toBe(true)
    })

    it('returns false when user is not customer', () => {
      vi.spyOn(roleService.roleService, 'isCustomer').mockReturnValue(false)

      expect(authService.isCustomer()).toBe(false)
    })
  })

  describe('isSeller', () => {
    it('returns true when user is seller', () => {
      vi.spyOn(roleService.roleService, 'isSeller').mockReturnValue(true)

      expect(authService.isSeller()).toBe(true)
    })

    it('returns false when user is not seller', () => {
      vi.spyOn(roleService.roleService, 'isSeller').mockReturnValue(false)

      expect(authService.isSeller()).toBe(false)
    })
  })
})
