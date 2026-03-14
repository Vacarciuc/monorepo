import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
   DiskHealthIndicator,
   HealthCheck,
   HealthCheckResult,
   HealthCheckService,
   MemoryHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '@/auth/decorators/auth.decorator';

@Controller('health')
@Public()
@ApiTags('Health')
export class HealthController {
   // 512 MB
   private readonly HEAP_THRESHOLD = 512 * 1024 * 1024;

   constructor(
      private readonly health: HealthCheckService,
      private readonly disk: DiskHealthIndicator,
      private readonly memory: MemoryHealthIndicator,
   ) {}

   @Get()
   @HealthCheck()
   check(): Promise<HealthCheckResult> {
      return this.health.check([
         () =>
            this.disk.checkStorage('storage', {
               path: '/',
               thresholdPercent: 0.85,
            }),
         () => this.memory.checkHeap('mem-heap', this.HEAP_THRESHOLD),
      ]);
   }
}
