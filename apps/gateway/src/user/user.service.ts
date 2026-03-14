import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import { BaseMicroserviceService } from '@/common/classes/base-microservice-service';
import { userEndpoints } from '@/user/constants/user-paths.constants';
import { UserDto } from '@/user/dto/response/user.dto';
import { UpdateUserDto } from '@/user/dto/request/update-user.dto';
import { PaginatedRequestDto } from '@/common/dto/request/paginated-request.dto';
import { UsersGetDto } from '@/user/dto/response/users-get.dto';
import { CreateUserDto } from '@/user/dto/request/create-user.dto';

@Injectable()
export class UserService extends BaseMicroserviceService {
   constructor(httpService: HttpService) {
      super(httpService, new Logger(UserService.name));
   }

   getOne(id: number): Promise<UserDto> {
      return this.forwardRequest({
         url: userEndpoints.getOne({ id: id.toString() }),
         method: 'GET',
      });
   }

   update(id: number, updateDto: UpdateUserDto): Promise<UserDto> {
      return this.forwardRequest({
         url: userEndpoints.update({ id: id.toString() }),
         method: 'PATCH',
         data: updateDto,
      });
   }

   delete(id: number): Promise<UserDto> {
      return this.forwardRequest({
         url: userEndpoints.delete({ id: id.toString() }),
         method: 'DELETE',
      });
   }

   get(queryDto: PaginatedRequestDto): Promise<UsersGetDto> {
      return this.forwardRequest({
         url: userEndpoints.get(),
         method: 'GET',
         params: queryDto,
      });
   }

   create(createDto: CreateUserDto): Promise<UserDto> {
      return this.forwardRequest({
         url: userEndpoints.create(),
         method: 'POST',
         data: createDto,
      });
   }

   restore(id: number): Promise<UserDto> {
      return this.forwardRequest({
         url: userEndpoints.restore({ id: id.toString() }),
         method: 'PATCH',
      });
   }
}
