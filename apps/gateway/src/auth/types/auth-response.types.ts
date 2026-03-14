import { UserDto } from '@/user/dto/response/user.dto';

export interface AuthResponse {
   token: string;
   user: UserDto;
}
