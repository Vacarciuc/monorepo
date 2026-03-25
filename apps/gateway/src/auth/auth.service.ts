import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

import { LoginDto } from "@/auth/dto/request/login.dto";
import { RegisterDto } from "@/auth/dto/request/register.dto";
import { BaseMicroserviceService } from "@/common/classes/base-microservice-service";
import { authEndpoints } from "@/auth/auth-endpoints.constants";
import { DecodedJwt } from "@/auth/decoded-jwt.types";

@Injectable()
export class AuthService extends BaseMicroserviceService {
  constructor(httpService: HttpService) {
    super(httpService, new Logger(AuthService.name));
  }

  login(dto: LoginDto): Promise<any> {
    return this.forwardRequest({
      url: authEndpoints.login(),
      method: "POST",
      data: dto,
    });
  }

  register(dto: RegisterDto): Promise<any> {
    return this.forwardRequest({
      url: authEndpoints.register(),
      method: "POST",
      data: dto,
    });
  }

  async validate(token: string): Promise<DecodedJwt> {
    return this.forwardRequest({
      url: authEndpoints.validate(),
      data: { token },
      method: "POST",
    });
  }

  async getSelf(token: string): Promise<any> {
    return this.forwardRequest({
      url: authEndpoints.getSelf(),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "GET",
    });
  }
}
