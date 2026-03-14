import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from '@/health/health.controller';

@Module({
   imports: [TerminusModule.forRoot()],
   exports: [],
   controllers: [HealthController],
   providers: [],
})
export class HealthModule {}
