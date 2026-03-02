import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { UserRole } from '@monorepo/common';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.CUSTOMER,
      };

      const savedUser = {
        id: '123',
        email: registerDto.email,
        password_hash: 'hashed_password',
        role: UserRole.CUSTOMER,
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('jwt_token');

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_password' as never));

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'jwt_token',
        userId: '123',
        role: UserRole.CUSTOMER,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.CUSTOMER,
      };

      mockUserRepository.findOne.mockResolvedValue({ id: '123' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '123',
        email: loginDto.email,
        password_hash: 'hashed_password',
        role: UserRole.CUSTOMER,
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt_token');

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'jwt_token',
        userId: '123',
        role: UserRole.CUSTOMER,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '123',
        email: loginDto.email,
        password_hash: 'hashed_password',
        role: UserRole.CUSTOMER,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false as never));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return a user when found', async () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: UserRole.CUSTOMER,
        created_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser('123');

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });
  });
});

