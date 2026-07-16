import AppDataSource from '../data-source';
import { seedSuperAdmin } from './super-admin.seed';

async function bootstrap() {
  await AppDataSource.initialize();
  await seedSuperAdmin(AppDataSource);
  await AppDataSource.destroy();
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });
