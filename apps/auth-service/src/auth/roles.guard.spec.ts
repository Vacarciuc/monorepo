import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'


import { RolesGuard } from './roles.guard'
import { UserRole } from '@/auth/user-role'

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: Reflector

  const createMockContext = (userRole?: UserRole): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnValue({
        user: userRole ? { role: userRole } : undefined,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<RolesGuard>(RolesGuard)
    reflector = module.get<Reflector>(Reflector)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  describe('canActivate', () => {
    it('should return true if no role is required (route is public/open)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)
      const context = createMockContext(UserRole.User)

      expect(guard.canActivate(context)).toBe(true)
    })

    it('should return false if there is no user on the request', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(UserRole.User)
      const context = createMockContext(undefined)

      expect(guard.canActivate(context)).toBe(false)
    })

    it('should return true if user role matches the required role exactly', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(UserRole.User)
      const context = createMockContext(UserRole.User)

      expect(guard.canActivate(context)).toBe(true)
    })
  })
})
