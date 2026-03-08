import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { UserRole } from '@/auth/user-role.enum'
import { CryptoService } from '@/crypto/crypto.service'
import { User } from '@/entities'

import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let repo: Repository<User>
  let cryptoService: CryptoService
  let jwtService: JwtService

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.User,
  } as User

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mockToken'),
            verifyAsync: jest
              .fn()
              .mockResolvedValue({ sub: '1', email: 'test@example.com' }),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mockValue') },
        },
        {
          provide: CryptoService,
          useValue: {
            hash: jest.fn().mockResolvedValue('hashedPassword'),
            hashCompare: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            existsBy: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    repo = module.get<Repository<User>>(getRepositoryToken(User))
    cryptoService = module.get<CryptoService>(CryptoService)
    jwtService = module.get<JwtService>(JwtService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' }

    it('should return a token on successful login', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockUser)
      jest.spyOn(cryptoService, 'hashCompare').mockResolvedValue(true)

      const result = await service.login(loginDto)
      expect(result).toEqual('mockToken')
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        relations: undefined,
      })
    })

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null)
      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException)
    })

    it('should throw UnauthorizedException if password is wrong', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockUser)
      jest.spyOn(cryptoService, 'hashCompare').mockResolvedValue(false)
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      username: 'tester',
      password: 'password123',
    }

    it('should create a user and return a token if email is unique', async () => {
      jest.spyOn(repo, 'existsBy').mockResolvedValue(false)
      jest
        .spyOn(repo, 'save')
        .mockResolvedValue({ ...mockUser, email: registerDto.email })

      const result = await service.register(registerDto)

      expect(result).toBe('mockToken')
      expect(cryptoService.hash).toHaveBeenCalledWith(registerDto.password)
      expect(repo.save).toHaveBeenCalled()
    })

    it('should throw ConflictException if email exists', async () => {
      jest.spyOn(repo, 'existsBy').mockResolvedValue(true)
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      )
    })
  })

  describe('validateToken', () => {
    it('should return decoded payload if token is valid', async () => {
      const result = await service.validateToken('valid-token')
      expect(result).toHaveProperty('sub', '1')
    })
  })
})
