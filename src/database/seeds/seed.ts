import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { AuthorizationSeeder } from './authorization/authorization.seeder';
import { SuperAdminSeeder } from './super-admin.seed';
import { TenantUserSeeder } from './tenant-users.seed';
import { ReferenceDataSeeder } from './reference-data.seed';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);

  try {
    const referenceDataSeeder = appContext.get(ReferenceDataSeeder);
    const authorizationSeeder = appContext.get(AuthorizationSeeder);
    const superAdminSeeder = appContext.get(SuperAdminSeeder);
    const tenantUserSeeder = appContext.get(TenantUserSeeder);

    await referenceDataSeeder.seed();

    await authorizationSeeder.seed();

    await superAdminSeeder.seed();

    await tenantUserSeeder.seed();
  } finally {
    await appContext.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });
