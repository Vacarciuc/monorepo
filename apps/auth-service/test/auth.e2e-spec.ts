import { INestApplication, ValidationPipe } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AppModule } from '@/app.module'
import { RolesGuard } from '@/auth/roles.guard'
import { User } from '@/entities'

describe('AuthController', () => {
  let app: INestApplication

  const mockUserRepo = {
    findOne: jest.fn(),
    existsBy: jest.fn(),
    save: jest.fn(),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepo)
      .overrideGuard(APP_GUARD)
      .useValue({
        canActivate: () => true,
      })

      // 2. Force RolesGuard to always pass
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = moduleFixture.createNestApplication()

    // const authService = moduleFixture.get<AuthService>(AuthService)
    // jest
    //   .spyOn(authService, 'validateToken')
    //   .mockImplementation(async (token): Promise<DecodedJwt | null> => {
    //     if (token === 'valid-test-token') {
    //       return {
    //         sub: 1,
    //         email: 'test@test.com',
    //         aud: 'dasi',
    //         role: UserRole.User,
    //         exp: Math.ceil(Date.now() / 1000) + 24 * 60 * 60,
    //         iat: Math.ceil(Date.now() / 1000),
    //         iss: 'dasi',
    //       }
    //     }
    //     return null
    //   })

    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  describe('/auth/login (POST)', () => {
    it('should return 201 and a token for valid credentials', () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: 'hashed_password_here',
      })

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' })
        .expect(201)
        .expect((res) => {
          expect(typeof res.text).toBe('string')
        })
    })

    it('should return 400 Bad Request if email is missing (ValidationPipe check)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'password123' }) // Missing email
        .expect(400)
    })
  })

  describe('/auth (GET) - Guard Check', () => {
    it('should return 401 Unauthorized if no token is provided', () => {
      return request(app.getHttpServer()).get('/auth').expect(401)
    })

    it('should return 200 if a valid Bearer token is provided', async () => {
      // Use the EXACT string your mock is looking for
      const validToken = 'valid-test-token'

      return request(app.getHttpServer())
        .get('/auth')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
