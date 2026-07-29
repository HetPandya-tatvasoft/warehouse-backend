import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Permission } from '@/modules/roles-and-permissions/entities/permission.entity';

@Injectable()
export class PermissionSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const permissionsToSeed = [
      { name: 'VIEW', description: 'View access permission' },
      { name: 'CREATE', description: 'Create access permission' },
      { name: 'UPDATE', description: 'Update access permission' },
      { name: 'DELETE', description: 'Delete access permission' },
    ];

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const permissionRepository = transactionalEntityManager.getRepository(Permission);

      for (const permissionData of permissionsToSeed) {
        const exists = await permissionRepository.findOne({
          where: { name: permissionData.name },
        });

        if (!exists) {
          const permission = permissionRepository.create(permissionData);
          await permissionRepository.save(permission);
        }
      }
    });
  }
}
