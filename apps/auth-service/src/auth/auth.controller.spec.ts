import { Test, TestingModule } from '@nestjs/testing'

import { AuthService } from '@/auth/auth.service'
import { UserRole } from '@/auth/user-role.enum'
import { LoginDto } from '@/dto/login.dto'
import { RegisterDto } from '@/dto/register.dto'

import { AuthController } from './auth.controller'

describe('AuthController', () => {
  let controller: AuthController
  let service: AuthService

  const mockToken = 'mock-jwt-token'
  const mockDecodedJwt = {
    sub: '1',
    email: 'test@test.com',
    role: UserRole.User,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(mockToken),
            register: jest.fn().mockResolvedValue(mockToken),
            getSelfDto: jest
              .fn()
              .mockResolvedValue({ id: 1, email: 'test@test.com' }),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService)
  })

  describe('login', () => {
    it('should return a token string', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'password123' }
      const result = await controller.login(dto)

      expect(result).toBe(mockToken)
      expect(service.login).toHaveBeenCalledWith(dto)
    })
  })

  describe('register', () => {
    it('should register a user and return a token', async () => {
      const dto: RegisterDto = {
        email: 'new@test.com',
        username: 'newuser',
        password: 'password123',
      }
      const result = await controller.register(dto)

      expect(result).toBe(mockToken)
      expect(service.register).toHaveBeenCalledWith(dto)
    })
  })

  describe('getSelf', () => {
    it('should return the self DTO based on the request token', async () => {
      const result = await controller.getSelf(mockDecodedJwt as any)

      expect(result).toEqual({ id: 1, email: 'test@test.com' })
      expect(service.getSelfDto).toHaveBeenCalledWith(mockDecodedJwt)
    })
  })
})
