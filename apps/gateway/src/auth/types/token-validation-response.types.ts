import { JsonWebTokenError } from '@nestjs/jwt';

import { DecodedJwt } from './decoded-jwt.types';

export interface TokenValidationResponse {
   valid: boolean;
   error: JsonWebTokenError;
   decoded: DecodedJwt;
}
