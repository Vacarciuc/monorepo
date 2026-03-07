import { Body, Controller, Get, Post } from '@nestjs/common'
import {
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'

import { Authorize, Public, RequestToken } from '@/auth/auth.decorator'
import { AuthService } from '@/auth/auth.service'
import type { DecodedJwt } from '@/auth/auth.types'
import { AppTag } from '@/config/tags.config'
import { GetSelfDto } from '@/dto/get-self.dto'
import { LoginDto } from '@/dto/login.dto'
import { RegisterDto } from '@/dto/register.dto'

@Controller('auth')
@ApiTags(AppTag.Auth)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto): Promise<string> {
    return this.authService.login(dto)
  }

  @Post('register')
  @Public()
  @ApiOperation({})
  @ApiOkResponse({ type: String, description: 'JWT token' })
  @ApiConflictResponse()
  async register(@Body() dto: RegisterDto): Promise<string> {
    return this.authService.register(dto)
  }

  @Get()
  @ApiOperation({ description: 'Get data about currently logged in user' })
  @ApiOkResponse({ type: GetSelfDto })
  @Authorize()
  async getSelf(@RequestToken() jwt: DecodedJwt): Promise<GetSelfDto> {
    return this.authService.getSelfDto(jwt)
  }
}
