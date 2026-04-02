import {
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '@/app.module'
import { CryptoService } from '@/crypto/crypto.service'
import { User } from '@/entities'

describe('AuthController (e2e)', () => {
  let app: INestApplication

  const registeredUsers = new Map<string, any>()

  const mockUser = {
    email: `test-${Date.now()}@example.com`,
    username: 'testuser',
    password: 'Password123!',
  }

  const mockUserRepo = {
    save: jest.fn().mockImplementation(async (user) => {
      const newUser = {
        ...user,
        id: user.id || Math.floor(Math.random() * 100000),
      }
      registeredUsers.set(newUser.email, newUser)
      return newUser
    }),

    findOne: jest.fn().mockImplementation(async ({ where }) => {
      if (where.email) {
        return registeredUsers.get(where.email) || null
      }
      if (where.id) {
        for (const user of registeredUsers.values()) {
          if (user.id === where.id) return user
        }
      }
      return null
    }),

    existsBy: jest.fn().mockImplementation(async (criteria) => {
      if (criteria.email) {
        return registeredUsers.has(criteria.email)
      }
      if (criteria.id) {
        for (const user of registeredUsers.values()) {
          if (user.id === criteria.id) return true
        }
      }
      return false
    }),

    find: jest.fn().mockImplementation(async () => {
      return Array.from(registeredUsers.values())
    }),

    delete: jest.fn().mockImplementation(async (id) => {
      let found = false
      for (const [email, user] of registeredUsers.entries()) {
        if (user.id === id) {
          registeredUsers.delete(email)
          found = true
          break
        }
      }
      return { affected: found ? 1 : 0 }
    }),
  }

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockUserRepo),
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
  } as unknown as DataSource

  const mockCryptoService = {
    hash: jest.fn().mockImplementation(async (password) => {
      return `hashed_${password}`
    }),

    hashCompare: jest.fn().mockImplementation(async (password, hash) => {
      return hash === `hashed_${password}`
    }),
  }

  const mockJwtService = {
    signAsync: jest.fn().mockImplementation(async (payload, options) => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .toString('base64')
        .replace(/=/g, '')
      const data = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/=/g, '')
      const signature = Buffer.from('fake-signature-' + Date.now())
        .toString('base64')
        .replace(/=/g, '')
      return `${header}.${data}.${signature}`
    }),

    verifyAsync: jest.fn().mockImplementation(async (token) => {
      try {
        const parts = token.split('.')
        if (parts.length !== 3) throw new Error()
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        return payload
      } catch (error) {
        throw new UnauthorizedException()
      }
    }),

    decode: jest.fn().mockImplementation((token) => {
      try {
        const parts = token.split('.')
        if (parts.length !== 3) return null
        const padded = parts[1] + '=='
        return JSON.parse(Buffer.from(padded, 'base64').toString())
      } catch {
        return null
      }
    }),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(mockDataSource)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepo)
      .overrideProvider(CryptoService)
      .useValue(mockCryptoService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /auth/register', () => {
    it('should register a new user and return a JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockUser)
        .expect(HttpStatus.CREATED)

      expect(typeof response.text).toBe('string')
      expect(response.text).toMatch(
        /^[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/,
      )

      expect(mockUserRepo.save).toHaveBeenCalled()
      expect(mockJwtService.signAsync).toHaveBeenCalled()

      expect(registeredUsers.has(mockUser.email)).toBe(true)
    })

    it('should return 409 Conflict if email already exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(mockUser)
        .expect(HttpStatus.CONFLICT)
    })

    it('should hash the password before saving', async () => {
      const newUser = {
        email: `newuser-${Date.now()}@example.com`,
        username: 'newuser',
        password: 'AnotherPass123!',
      }

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(HttpStatus.CREATED)

      const savedUser = registeredUsers.get(newUser.email)
      expect(savedUser.password).toBe(`hashed_${newUser.password}`)
      expect(mockCryptoService.hash).toHaveBeenCalledWith(newUser.password)
    })
  })

  describe('POST /auth/login', () => {
    it('should login successfully and return a JWT token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        })
        .expect(HttpStatus.CREATED)

      expect(response.text).toMatch(
        /^[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/,
      )

      expect(mockCryptoService.hashCompare).toHaveBeenCalledWith(
        mockUser.password,
        `hashed_${mockUser.password}`,
      )
    })

    it('should return 401 Unauthorized for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: mockUser.email,
          password: 'WrongPassword123!',
        })
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('should return 404 Not Found for non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password',
        })
        .expect(HttpStatus.NOT_FOUND)
    })
  })

  describe('GET /auth', () => {
    it('should return current user profile with valid token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        })

      const token = loginResponse.text

      const response = await request(app.getHttpServer())
        .get('/auth')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)

      expect(response.body.email).toBe(mockUser.email)
      expect(response.body.username).toBe(mockUser.username)
      expect(response.body).toHaveProperty('id')
    })

    it('should return 500 if no token provided (Protected endpoint)', async () => {
      const response = await request(app.getHttpServer()).get('/auth')

      expect(response.status).toBe(500)
    })

    it('should return 401 for malformed token', async () => {
      await request(app.getHttpServer())
        .get('/auth')
        .set('Authorization', 'Bearer invalid.token.format')
        .expect(HttpStatus.UNAUTHORIZED)
    })
  })

  describe('POST /auth/validate', () => {
    it('should validate a token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        })

      const token = loginResponse.text

      const response = await request(app.getHttpServer())
        .post('/auth/validate')
        .send({ token })
        .expect(HttpStatus.CREATED)

      expect(response.body).toHaveProperty('sub')
      expect(response.body).toHaveProperty('email')
    })
  })
})
