import { Injectable } from '@nestjs/common';
import { PageSeeder } from './page.seeder';
import { PermissionSeeder } from './permission.seeder';
import { PageAccessSeeder } from './page-access.seeder';

@Injectable()
export class AuthorizationSeeder {
  constructor(
    private readonly pageSeeder: PageSeeder,
    private readonly permissionSeeder: PermissionSeeder,
    private readonly pageAccessSeeder: PageAccessSeeder,
  ) {}

  async seed(): Promise<void> {
    await this.pageSeeder.seed();

    await this.permissionSeeder.seed();

    await this.pageAccessSeeder.seed();
  }
}
