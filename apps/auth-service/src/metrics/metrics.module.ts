import { Module } from '@nestjs/common'
import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus'

import { MetricName } from '@/metrics/metric-name.enum'
import { MetricsService } from '@/metrics/metrics.service'
import { TotalRequestsMetricsInterceptor } from '@/metrics/total-requests-metrics.interceptor'

@Module({
  imports: [
    PrometheusModule.register({
      global: true,
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    MetricsService,
    TotalRequestsMetricsInterceptor,
    makeCounterProvider({
      name: MetricName.TotalRequests,
      help: 'Total requests received',
    }),
    makeGaugeProvider({
      name: MetricName.RequestsPerMinute,
      help: 'Requests per minute',
    }),
  ],
  controllers: [],
  exports: [MetricsService, TotalRequestsMetricsInterceptor],
})
export class MetricsModule {}
