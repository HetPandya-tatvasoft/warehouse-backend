import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Page } from '@/modules/roles-and-permissions/entities/page.entity';

@Injectable()
export class PageSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const pagesToSeed = [
      { name: 'Users', description: 'User management page' },
      { name: 'Roles', description: 'Role and permission management page' },
      { name: 'Branches', description: 'Branch management page' },
      { name: 'Warehouses', description: 'Warehouse management page' },
    ];

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const pageRepository = transactionalEntityManager.getRepository(Page);

      for (const pageData of pagesToSeed) {
        const exists = await pageRepository.findOne({
          where: { name: pageData.name },
        });

        if (!exists) {
          const page = pageRepository.create(pageData);
          await pageRepository.save(page);
        }
      }
    });
  }
}
