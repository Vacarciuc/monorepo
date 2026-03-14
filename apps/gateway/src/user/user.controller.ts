import {
   Body,
   Controller,
   Delete,
   Get,
   Param,
   ParseIntPipe,
   Patch,
   Post,
   Query,
} from '@nestjs/common';
import {
   ApiBadRequestResponse,
   ApiCookieAuth,
   ApiForbiddenResponse,
   ApiNotFoundResponse,
   ApiOkResponse,
   ApiOperation,
   ApiTags,
   ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserService } from '@/user/user.service';
import { UserDto } from '@/user/dto/response/user.dto';
import { UpdateUserDto } from '@/user/dto/request/update-user.dto';
import { PaginatedRequestDto } from '@/common/dto/request/paginated-request.dto';
import { UsersGetDto } from '@/user/dto/response/users-get.dto';
import { CreateUserDto } from '@/user/dto/request/create-user.dto';
import { Role } from '@/auth/decorators/roles.decroator';
import { UserRole } from '@/user/enums/user-role.enum';

@Controller('user')
@ApiTags('User')
@ApiCookieAuth()
@ApiNotFoundResponse()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiBadRequestResponse()
export class UserController {
   constructor(private readonly userService: UserService) {}

   @Get(':id')
   @Role(UserRole.User)
   @ApiOperation({
      summary: 'Get user details',
      description: 'Required role: <b>User</b>',
   })
   @ApiOkResponse({ type: UserDto })
   getOne(@Param('id') id: number): Promise<UserDto> {
      return this.userService.getOne(id);
   }
}
