import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'

import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

describe('AuthGuard', () => {
  let guard: AuthGuard
  let authService: AuthService
  let reflector: Reflector

  const mockRequest = (authHeader?: string) => ({
    header: jest.fn().mockReturnValue(authHeader),
    user: null,
  })

  const mockContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue(request),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: AuthService,
          useValue: { validateToken: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile()

    guard = module.get<AuthGuard>(AuthGuard)
    authService = module.get<AuthService>(AuthService)
    reflector = module.get<Reflector>(Reflector)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  describe('canActivate', () => {
    it('should allow access if token is valid', async () => {
      const decodedToken = { sub: '1', email: 'test@test.com' }
      const req = mockRequest('Bearer valid-token')
      const context = mockContext(req)

      jest
        .spyOn(authService, 'validateToken')
        .mockResolvedValue(decodedToken as any)

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(req.user).toEqual(decodedToken)
    })

    it('should throw UnauthorizedException if no token and route is NOT public', async () => {
      const req = mockRequest(undefined)
      const context = mockContext(req)

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should allow access if no token but route IS public', async () => {
      const req = mockRequest(undefined)
      const context = mockContext(req)

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true)

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
    })

    it('should throw UnauthorizedException if token is malformed (Bearer missing)', async () => {
      const req = mockRequest('invalid-format')
      const context = mockContext(req)

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException if authService returns null', async () => {
      const req = mockRequest('Bearer bad-token')
      const context = mockContext(req)

      jest.spyOn(authService, 'validateToken').mockResolvedValue(null)

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException if authService throws JsonWebTokenError', async () => {
      const req = mockRequest('Bearer bad-token')
      const context = mockContext(req)

      jest
        .spyOn(authService, 'validateToken')
        .mockRejectedValue(new UnauthorizedException('invalid'))

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})
