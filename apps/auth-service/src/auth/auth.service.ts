import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { plainToInstance } from 'class-transformer'
import { FindOneOptions, Repository } from 'typeorm'

import { DecodedJwt } from '@/auth/auth'
import { UserRole } from '@/auth/user-role'
import { CryptoService } from '@/crypto/crypto.service'
import { GetSelfDto } from '@/dto/get-self.dto'
import { LoginDto } from '@/dto/login.dto'
import { RegisterDto } from '@/dto/register.dto'
import { User } from '@/entities'
import { AppEnv } from '@/types/app-env.types'

@Injectable()
export class AuthService {
  private readonly signOptions: JwtSignOptions
  private readonly verifyOptions: JwtVerifyOptions

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppEnv>,
    private readonly cryptoService: CryptoService,
    @InjectRepository(User)
    private readonly userRepo: Repository<TypeRef<User>>,
  ) {
    const aud = this.config.get('JWT_AUD')

    this.signOptions = {
      secret: config.get('JWT_SECRET'),
      expiresIn: config.get('JWT_TTL'),
      audience: aud,
      encoding: 'utf-8',
      algorithm: 'HS256',
      allowInsecureKeySizes: false,
    }

    this.verifyOptions = {
      secret: this.config.get('JWT_SECRET'),
      audience: Array.isArray(aud) ? aud[0] : aud,
      algorithms: ['HS256'],
    }
  }

  checkPassword(user: User, password: string): Promise<boolean> {
    return this.cryptoService.hashCompare(password, user.password)
  }

  async createToken(user: User): Promise<string> {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    }
    return this.jwtService.signAsync(payload, this.signOptions)
  }

  findOneById(
    id: number,
    relations?: FindOneOptions<User>['relations'],
  ): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations })
  }

  async getAuthenticated(
    decoded: DecodedJwt,
    relations?: FindOneOptions<User>['relations'],
  ): Promise<User> {
    const id = parseInt(decoded.sub as any)
    return (await this.findOneById(id, relations))!
  }

  async validateToken(token: string): Promise<DecodedJwt | null> {
    try {
      return this.jwtService.verifyAsync<DecodedJwt>(token, this.verifyOptions)
    } catch (err) {
      return null
    }
  }

  async getSelfDto(jwt: DecodedJwt): Promise<GetSelfDto> {
    const user = await this.getAuthenticated(jwt, {})

    return plainToInstance(GetSelfDto, user)
  }

  async exists(id: number): Promise<boolean> {
    return this.userRepo.existsBy({ id })
  }

  async existsEmail(email: string): Promise<boolean> {
    return this.userRepo.existsBy({ email })
  }

  async register(dto: RegisterDto): Promise<string> {
    const exists = await this.existsEmail(dto.email)

    if (exists) {
      throw new ConflictException()
    }

    const user = await this.create(dto)
    const token = await this.createToken(user)
    return token
  }

  getOneByEmail(
    email: string,
    relations?: FindOneOptions<User>['relations'],
  ): Promise<User | null> {
    return this.userRepo.findOne({ where: { email }, relations })
  }

  async login(dto: LoginDto): Promise<string> {
    const user = await this.getOneByEmail(dto.email)

    if (user === null) {
      throw new NotFoundException()
    }

    const passwordCorrect = await this.checkPassword(user, dto.password)

    if (!passwordCorrect) {
      throw new UnauthorizedException()
    }

    return this.createToken(user)
  }

  async create(dto: RegisterDto): Promise<User> {
    const user = new User()

    user.email = dto.email
    user.username = dto.username
    user.password = await this.cryptoService.hash(dto.password)
    user.createdAt = new Date()
    user.role = UserRole.User

    return this.userRepo.save(user)
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      // where: {},
      // take: -1,
      // skip: 0,
    })
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User${id} not found`)
    }
    return user
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepo.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException(`User ${id} not found`)
    }
  }

  async updateRole(id: number, role: UserRole): Promise<User> {
    const user = await this.findOne(id)
    user.role = role
    return this.userRepo.save(user)
  }

  async seedAdmin(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@marketplace.com'
    const exists = await this.existsEmail(adminEmail)
    if (!exists) {
      const user = new User()
      user.email = adminEmail
      user.username = 'admin'
      user.password = await this.cryptoService.hash(
        process.env.ADMIN_PASSWORD ?? 'Admin@123!',
      )
      user.role = UserRole.Admin
      user.createdAt = new Date()
      await this.userRepo.save(user)
    }
  }
}
