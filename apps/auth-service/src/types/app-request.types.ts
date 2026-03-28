import { Request } from 'express'

import { DecodedJwt } from '@/auth/auth'

// Request context with the user field that is the decoded token
export interface AppRequest extends Request {
  user?: DecodedJwt
}
