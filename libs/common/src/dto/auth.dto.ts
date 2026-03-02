import { UserRole } from '../enums';

export class RegisterDto {
  email: string;
  password: string;
  role: UserRole;
}

export class LoginDto {
  email: string;
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  userId: string;
  role: UserRole;
}

