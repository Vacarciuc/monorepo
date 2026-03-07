import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
// Adjust path to your root module
import { getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'

import { AppModule } from '@/app.module'
import { User } from '@/entities'

describe('AuthController (Integration)', () => {
  let app: INestApplication

  // Mocking the DB repository to avoid needing a real database
  const mockUserRepo = {
    findOne: jest.fn(),
    existsBy: jest.fn(),
    save: jest.fn(),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepo)
      .compile()

    app = moduleFixture.createNestApplication()

    // IMPORTANT: Integration tests must include the same pipes/guards as the real app
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  describe('/auth/login (POST)', () => {
    it('should return 201 and a token for valid credentials', () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: 'hashed_password_here', // Assuming CryptoService mock handles comparison
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
      return request(app.getHttpServer()).get('/auth').expect(401) // Verifies AuthGuard is working
    })

    it('should return 200 if a valid Bearer token is provided', async () => {
      // 1. Get a real token or mock the validation
      // For a true integration test, we use the real AuthService to sign a token
      const validToken = '...'

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
