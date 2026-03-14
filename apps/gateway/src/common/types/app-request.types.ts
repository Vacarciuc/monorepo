import { Request } from 'express';

import { DecodedJwt } from '@/auth/types/decoded-jwt.types';

export interface AppRequest extends Request {
   user?: DecodedJwt;
}
