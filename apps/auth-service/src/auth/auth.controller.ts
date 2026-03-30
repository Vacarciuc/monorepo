import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { Public, RequestToken } from '@/auth/auth.decorator'
import { AuthService } from '@/auth/auth.service'
import { AppTag } from '@/config/tags.config'
import { GetSelfDto } from '@/dto/get-self.dto'
import { LoginDto } from '@/dto/login.dto'
import { RegisterDto } from '@/dto/register.dto'
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
  @ApiOkResponse({ type: String, description: 'JWT token' })
  @ApiConflictResponse()
  register(@Body() dto: RegisterDto): Promise<string> {
    return this.authService.register(dto)
  }

  @Get()
  @ApiOperation({ description: 'Get data about currently logged in user' })
  @ApiOkResponse({ type: GetSelfDto })
  @Public()
  getSelf(@RequestToken() jwt: DecodedJwt): Promise<GetSelfDto> {
    return this.authService.getSelfDto(jwt)
  }

  @Post('validate')
  @Public()
  @ApiOperation({
    summary: 'Validate a JWT token',
  })
  validate(@Body() body: any): ReturnType<AuthService['validateToken']> {
    return this.authService.validateToken(body.token)
  }

  @Get('users')
  @Public()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ type: [UserDto] }) // Assuming User entity is exported
  async findAll(): Promise<UserDto[]> {
    const users = await this.authService.findAll()
    return users.map((user) => plainToInstance(UserDto, user))
  }

  @Get('users/:id')
  @Public()
  @ApiOperation({ summary: 'Get one user by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    const user = await this.authService.findOne(id)
    return plainToInstance(UserDto, user)
  }

  @Delete('users/:id')
  @Public()
  @ApiOperation({ summary: 'Delete a user' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.authService.remove(id)
  }
}
