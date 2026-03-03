import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '@monorepo/common';

describe('Auth Service E2E Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {

    await userRepository.clear();
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full customer registration and login flow', async () => {

      const registerDto = {
        email: 'customer@marketplace.com',
        password: 'securePassword123',
        role: UserRole.CUSTOMER,
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('accessToken');
      expect(registerResponse.body).toHaveProperty('userId');
      expect(registerResponse.body.role).toBe(UserRole.CUSTOMER);

      const customerId = registerResponse.body.userId;
      const customerToken = registerResponse.body.accessToken;


      expect(customerToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);


      const loginDto = {
        email: registerDto.email,
        password: registerDto.password,
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body.userId).toBe(customerId);
      expect(loginResponse.body.role).toBe(UserRole.CUSTOMER);

      const user = await userRepository.findOne({
        where: { id: customerId },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe(registerDto.email);
      expect(user?.role).toBe(UserRole.CUSTOMER);
    });

    it('should complete full seller registration and login flow', async () => {
      const registerDto = {
        email: 'seller@marketplace.com',
        password: 'securePassword123',
        role: UserRole.SELLER,
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(registerResponse.body.role).toBe(UserRole.SELLER);

      const sellerId = registerResponse.body.userId;


      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerDto.email,
          password: registerDto.password,
        })
        .expect(200);

      expect(loginResponse.body.userId).toBe(sellerId);
      expect(loginResponse.body.role).toBe(UserRole.SELLER);


      const seller = await userRepository.findOne({
        where: { id: sellerId },
      });

      expect(seller).toBeDefined();
      expect(seller?.role).toBe(UserRole.SELLER);
    });

    it('should handle multiple user registrations', async () => {
      const users = [
        {
          email: 'user1@example.com',
          password: 'password123',
          role: UserRole.CUSTOMER,
        },
        {
          email: 'user2@example.com',
          password: 'password123',
          role: UserRole.SELLER,
        },
        {
          email: 'user3@example.com',
          password: 'password123',
          role: UserRole.CUSTOMER,
        },
      ];

      const registeredUsers = [];


      for (const userData of users) {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData)
          .expect(201);

        registeredUsers.push(response.body);
      }


      const userIds = registeredUsers.map((u) => u.userId);
      const uniqueIds = new Set(userIds);
      expect(uniqueIds.size).toBe(users.length);


      for (let i = 0; i < users.length; i++) {
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: users[i].email,
            password: users[i].password,
          })
          .expect(200);

        expect(loginResponse.body.userId).toBe(registeredUsers[i].userId);
        expect(loginResponse.body.role).toBe(users[i].role);
      }
    });

    it('should reject duplicate email registration', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        role: UserRole.CUSTOMER,
      };


      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);


      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);


      const users = await userRepository.find({
        where: { email: registerDto.email },
      });
      expect(users).toHaveLength(1);
    });

    it('should not expose password in any response', async () => {
      const registerDto = {
        email: 'security@example.com',
        password: 'password123',
        role: UserRole.CUSTOMER,
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);


      expect(registerResponse.body).not.toHaveProperty('password');
      expect(registerResponse.body).not.toHaveProperty('password_hash');


      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerDto.email,
          password: registerDto.password,
        })
        .expect(200);

      expect(loginResponse.body).not.toHaveProperty('password');
      expect(loginResponse.body).not.toHaveProperty('password_hash');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidRequests = [
        { email: 'invalid', password: 'pass', role: UserRole.CUSTOMER },
        { email: 'test@test.com', password: '123', role: UserRole.CUSTOMER },
        { email: 'test@test.com', password: 'password123' }, // missing role
        { password: 'password123', role: UserRole.CUSTOMER }, // missing email
      ];

      for (const invalidData of invalidRequests) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(invalidData)
          .expect(400);
      }
    });
    it('should handle login with wrong credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'correctPassword',
          role: UserRole.CUSTOMER,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword',
        })
        .expect(401);
    });
  });
});





