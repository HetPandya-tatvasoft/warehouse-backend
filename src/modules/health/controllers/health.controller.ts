import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck, HealthCheckError } from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Liveness check: verifies NestJS process is alive and responsive
      () => ({ application: { status: 'up' } }),
      // Readiness check: verifies PostgreSQL is reachable via the existing TypeORM DataSource
      () =>
        this.db.pingCheck('database', { timeout: 3000 }).catch(() => {
          // Catch raw database connection details and throw a sanitized HealthCheckError
          // preventing leakage of credentials, ports, hosts, etc. in the HTTP response.
          throw new HealthCheckError('Database check failed', {
            database: {
              status: 'down',
              message: 'Service is unavailable',
            },
          });
        }),
    ]);
  }
}
