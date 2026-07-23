import { Role } from '../../modules/roles-and-permissions/entities/role.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { PlatformRoleCodes } from '../../common/enums/role.enum';
import type { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedTenantUser(dataSource: DataSource): Promise<void> {
  const tenantName = 'Tatvasoft';
  const userFirstName = 'Het';
  const userLastName = 'Pandya';
  const userEmail = 'het.pandya@yopmail.com';

  await dataSource.transaction(async (transactionalEntityManager) => {
    const tenantRepository = transactionalEntityManager.getRepository(Tenant);
    const roleRepository = transactionalEntityManager.getRepository(Role);
    const userRepository = transactionalEntityManager.getRepository(User);
    const userRoleRepository = transactionalEntityManager.getRepository(UserRole);

    let role = await roleRepository.findOne({
      where: { name: PlatformRoleCodes.TENANT_ADMIN },
    });

    if (!role) {
      role = roleRepository.create({
        name: PlatformRoleCodes.TENANT_ADMIN,
        tenantId: null,
      });
      role = await roleRepository.save(role);
    }

    let tenant = await tenantRepository.findOne({
      where: { name: tenantName },
    });

    if (!tenant) {
      tenant = tenantRepository.create({
        name: tenantName,
      });
      tenant = await tenantRepository.save(tenant);
    }

    let user = await userRepository.findOne({
      where: {
        email: userEmail,
        tenantId: tenant.id,
      },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(process.env.GENERAL_PASSWORD!, 12);

      user = userRepository.create({
        lastName: userLastName,
        firstName: userFirstName,
        email: userEmail,
        tenantId: tenant.id,
        passwordHash: passwordHash,
      });
      user = await userRepository.save(user);
    }

    let userRoleMapping = await userRoleRepository.findOne({
      where: {
        userId: user.id,
        roleId: role.id,
      },
    });

    if (!userRoleMapping) {
      userRoleMapping = userRoleRepository.create({
        userId: user.id,
        roleId: role.id,
      });
      await userRoleRepository.save(userRoleMapping);
    }
  });
}
