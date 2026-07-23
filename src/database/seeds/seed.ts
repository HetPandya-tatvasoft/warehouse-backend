import { NestFactory } from '@nestjs/core';
import { SeederModule } from './authorization/seeder.module';
import { SuperAdminSeeder } from './super-admin.seed';
import { TenantUserSeeder } from './tenant-users.seed';

async function bootstrap() {
  console.log('Bootstrapping NestJS application context for seeding...');
  const appContext = await NestFactory.createApplicationContext(SeederModule);

  try {
    const superAdminSeeder = appContext.get(SuperAdminSeeder);
    const tenantUserSeeder = appContext.get(TenantUserSeeder);

    console.log('Running Super Admin Seeder...');
    await superAdminSeeder.seed();

    console.log('Running Tenant User Seeder...');
    await tenantUserSeeder.seed();

    console.log('Seeding completed successfully.');
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
