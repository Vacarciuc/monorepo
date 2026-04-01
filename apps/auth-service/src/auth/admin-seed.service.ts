import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'

import { AuthService } from '@/auth/auth.service'

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name)

  constructor(private readonly authService: AuthService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.authService.seedAdmin()
      this.logger.log('Verificare cont admin finalizată.')
    } catch (err) {
      this.logger.error('Eroare la seed admin:', err)
    }
  }
}

