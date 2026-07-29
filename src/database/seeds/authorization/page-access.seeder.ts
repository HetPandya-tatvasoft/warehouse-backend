import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Page } from '@/modules/roles-and-permissions/entities/page.entity';
import { Permission } from '@/modules/roles-and-permissions/entities/permission.entity';
import { PageAccess } from '@/modules/roles-and-permissions/entities/page-access.entity';

@Injectable()
export class PageAccessSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const pageRepository = transactionalEntityManager.getRepository(Page);
      const permissionRepository = transactionalEntityManager.getRepository(Permission);
      const pageAccessRepository = transactionalEntityManager.getRepository(PageAccess);

      const pages = await pageRepository.find();
      const permissions = await permissionRepository.find();

      const existingPageAccesses = await pageAccessRepository.find();
      const existingKeys = new Set(existingPageAccesses.map((pa) => `${pa.pageId}_${pa.accessTypeId}`));

      const newPageAccesses: PageAccess[] = [];

      for (const page of pages) {
        for (const permission of permissions) {
          const key = `${page.id}_${permission.id}`;
          if (!existingKeys.has(key)) {
            const pageAccess = pageAccessRepository.create({
              pageId: page.id,
              accessTypeId: permission.id,
            });
            newPageAccesses.push(pageAccess);
          }
        }
      }

      if (newPageAccesses.length > 0) {
        await pageAccessRepository.save(newPageAccesses);
      }
    });
  }
}
