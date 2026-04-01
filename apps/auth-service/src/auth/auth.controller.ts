import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common'
import {
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { plainToInstance } from 'class-transformer'

import { type DecodedJwt } from '@/auth/auth'
import { Authorize, Public, RequestToken } from '@/auth/auth.decorator'
import { AuthService } from '@/auth/auth.service'
import { AppTag } from '@/config/tags.config'
import { GetSelfDto } from '@/dto/get-self.dto'
import { LoginDto } from '@/dto/login.dto'
import { RegisterDto } from '@/dto/register.dto'
import { UpdateRoleDto } from '@/dto/update-role.dto'
import { UserDto } from '@/dto/user.dto'

@Controller('auth')
@ApiTags(AppTag.Auth)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  login(@Body() dto: LoginDto): Promise<string> {
    return this.authService.login(dto)
  }

  @Post('register')
  @Public()
  @ApiOperation({})
  @ApiOkResponse({ type: String, description: 'Token JWT' })
  @ApiConflictResponse()
  register(@Body() dto: RegisterDto): Promise<string> {
    return this.authService.register(dto)
  }

  @Get()
  @Authorize()
  @ApiOperation({ description: 'Returnează datele utilizatorului autentificat' })
  @ApiOkResponse({ type: GetSelfDto })
  getSelf(@RequestToken() jwt: DecodedJwt): Promise<GetSelfDto> {
    return this.authService.getSelfDto(jwt)
  }

  @Post('validate')
  @Public()
  @ApiOperation({ summary: 'Validează un token JWT' })
  validate(@Body() body: any): ReturnType<AuthService['validateToken']> {
    return this.authService.validateToken(body.token)
  }

  @Get('users')
  @Authorize()
  @ApiOperation({ summary: 'Returnează toți utilizatorii' })
  @ApiOkResponse({ type: [UserDto] })
  async findAll(): Promise<UserDto[]> {
    const users = await this.authService.findAll()
    return users.map((user) => plainToInstance(UserDto, user))
  }

  @Get('users/:id')
  @Authorize()
  @ApiOperation({ summary: 'Returnează un utilizator după ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    const user = await this.authService.findOne(id)
    return plainToInstance(UserDto, user)
  }

  @Patch('users/:id/role')
  @Authorize()
  @ApiOperation({ summary: 'Actualizează rolul unui utilizator' })
  @ApiOkResponse({ type: UserDto })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<UserDto> {
    const user = await this.authService.updateRole(id, dto.role)
    return plainToInstance(UserDto, user)
  }

  @Delete('users/:id')
  @Authorize()
  @ApiOperation({ summary: 'Șterge un utilizator' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.authService.remove(id)
  }
}
