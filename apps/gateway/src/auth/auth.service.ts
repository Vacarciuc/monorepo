import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'

import { authEndpoints } from '@/auth/auth-endpoints.constants'
import { DecodedJwt } from '@/auth/decoded-jwt.types'
import { LoginDto } from '@/auth/dto/request/login.dto'
import { RegisterDto } from '@/auth/dto/request/register.dto'
import { UpdateUserRoleDto } from '@/auth/dto/request/update-user-role.dto'
import { BaseMicroserviceService } from '@/common/classes/base-microservice-service'
import { UserDto } from '@/auth/dto/response/user.dto'

@Injectable()
export class AuthService extends BaseMicroserviceService {
  constructor(httpService: HttpService) {
    super(httpService, new Logger(AuthService.name))
  }

  login(dto: LoginDto): Promise<any> {
    return this.forwardRequest({
      url: authEndpoints.login(),
      method: 'POST',
      data: dto,
    })
  }

  register(dto: RegisterDto): Promise<any> {
    return this.forwardRequest({
      url: authEndpoints.register(),
      method: 'POST',
      data: dto,
    })
  }

  async validate(token: string): Promise<DecodedJwt> {
    return this.forwardRequest({
      url: authEndpoints.validate(),
      data: { token },
      method: 'POST',
    })
  }

  async getSelf(token: string): Promise<any> {
    return this.forwardRequest({
      url: authEndpoints.getSelf(),
      headers: { Authorization: `Bearer ${token}` },
      method: 'GET',
    })
  }

  async findUsers(token: string): Promise<UserDto[]> {
    return this.forwardRequest({
      url: authEndpoints.findUsers(),
      headers: { Authorization: `Bearer ${token}` },
      method: 'GET',
    })
  }

  async findOne(id: number, token: string): Promise<UserDto> {
    return this.forwardRequest({
      url: authEndpoints.findUser({ id: id.toString() }),
      headers: { Authorization: `Bearer ${token}` },
      method: 'GET',
    })
  }

  async updateUserRole(id: number, dto: UpdateUserRoleDto, token: string): Promise<UserDto> {
    return this.forwardRequest({
      url: authEndpoints.updateUserRole({ id: id.toString() }),
      headers: { Authorization: `Bearer ${token}` },
      method: 'PATCH',
      data: dto,
    })
  }

  async deleteUser(id: number, token: string): Promise<void> {
    return this.forwardRequest({
      url: authEndpoints.deleteUser({ id: id.toString() }),
      headers: { Authorization: `Bearer ${token}` },
      method: 'DELETE',
    })
  }
}
