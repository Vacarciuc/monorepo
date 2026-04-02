import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Request } from 'express'

import { Authorize, Public, Role } from '@/auth/auth.decorator'
import { AuthService } from '@/auth/auth.service'
import { LoginDto } from '@/auth/dto/request/login.dto'
import { RegisterDto } from '@/auth/dto/request/register.dto'
import { UpdateUserRoleDto } from '@/auth/dto/request/update-user-role.dto'
import { UserRole } from '@/auth/user-role'

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
  @ApiOkResponse({ type: String, description: 'Token JWT' })
  @ApiConflictResponse()
  async register(
    @Body() dto: RegisterDto,
  ): ReturnType<AuthService['register']> {
    return this.authService.register(dto)
  }

  @Get('')
  @Authorize()
  @ApiOperation({ summary: 'Date utilizator autentificat' })
  @ApiOkResponse({ type: String })
  async getSelf(@Req() req: Request): ReturnType<AuthService['getSelf']> {
    if (!req.headers.authorization) {
      throw new UnauthorizedException()
    }
    const token = req.headers.authorization!.split(' ')[1]!
    return this.authService.getSelf(token)
  }

  @Get('users')
  @Role(UserRole.Admin)
  @ApiForbiddenResponse()
  @ApiOperation({ summary: 'Returnează toți utilizatorii (doar admin)' })
  async findUsers(@Req() req: Request): ReturnType<AuthService['findUsers']> {
    const token = req.headers.authorization!.split(' ')[1]!
    return this.authService.findUsers(token)
  }

  @Get('users/:id')
  @Role(UserRole.Admin)
  @ApiForbiddenResponse()
  @ApiOperation({ summary: 'Returnează un utilizator după ID (doar admin)' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): ReturnType<AuthService['findOne']> {
    const token = req.headers.authorization!.split(' ')[1]!
    return this.authService.findOne(id, token)
  }

  @Patch('users/:id/role')
  @Role(UserRole.Admin)
  @ApiForbiddenResponse()
  @ApiOperation({ summary: 'Actualizează rolul unui utilizator (doar admin)' })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: Request,
  ): ReturnType<AuthService['updateUserRole']> {
    const token = req.headers.authorization!.split(' ')[1]!
    return this.authService.updateUserRole(id, dto, token)
  }

  @Delete('users/:id')
  @Role(UserRole.Admin)
  @ApiForbiddenResponse()
  @ApiOperation({ summary: 'Șterge un utilizator (doar admin)' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): ReturnType<AuthService['deleteUser']> {
    const token = req.headers.authorization!.split(' ')[1]!
    return this.authService.deleteUser(id, token)
  }
}
