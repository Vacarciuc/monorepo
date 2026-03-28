import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Request } from 'express'

import { Authorize, Public, RequestUser } from '@/auth/auth.decorator'
import { AuthService } from '@/auth/auth.service'
import { LoginDto } from '@/auth/dto/request/login.dto'
import { RegisterDto } from '@/auth/dto/request/register.dto'

@Controller('auth')
@ApiTags('Auth')
@ApiBadRequestResponse()
@ApiUnauthorizedResponse()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto): ReturnType<AuthService['login']> {
    return this.authService.login(dto)
  }

  @Post('register')
  @Public()
  @ApiOperation({})
  @ApiOkResponse({ type: String, description: 'JWT token' })
  @ApiConflictResponse()
  async register(
    @Body() dto: RegisterDto,
  ): ReturnType<AuthService['register']> {
    return this.authService.register(dto)
  }

  @Get('')
  @Authorize()
  @ApiOperation({})
  @ApiOkResponse({ type: String, description: 'JWT token' })
  @ApiConflictResponse()
  async getSelf(@Req() req: Request): ReturnType<AuthService['getSelf']> {
    const token = req.headers.authorization!.split(' ')[1]!
    return this.authService.getSelf(token)
  }
}
