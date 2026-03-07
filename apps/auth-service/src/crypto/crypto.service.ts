import { Injectable } from '@nestjs/common'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

@Injectable()
export class CryptoService {
  private readonly SALT_ROUNDS = 12

  generateToken(len = 16, enc: BufferEncoding = 'hex') {
    return crypto.randomBytes(len).toString(enc)
  }

  hash(str: string): Promise<string> {
    return bcrypt.hash(str, this.SALT_ROUNDS)
  }

  hashCompare(str: string, hash: string): Promise<boolean> {
    return bcrypt.compare(str, hash)
  }
}
