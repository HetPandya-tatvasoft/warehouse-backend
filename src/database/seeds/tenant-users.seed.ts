import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../../modules/roles-and-permissions/entities/role.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Country } from '../../modules/reference-data/entities/country.entity';
import { State } from '../../modules/reference-data/entities/state.entity';
import { City } from '../../modules/reference-data/entities/city.entity';
import { Address } from '../../common/entities/address.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { PlatformRoleCodes } from '../../common/enums/role.enum';
import { PageAccess } from '../../modules/roles-and-permissions/entities/page-access.entity';
import { RolePageRight } from '../../modules/roles-and-permissions/entities/role-page-right.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantUserSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const tenantName = 'Tatvasoft';
    const userFirstName = 'Het';
    const userLastName = 'Pandya';
    const userEmail = 'het.pandya@yopmail.com';

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const tenantRepository = transactionalEntityManager.getRepository(Tenant);
      const roleRepository = transactionalEntityManager.getRepository(Role);
      const userRepository = transactionalEntityManager.getRepository(User);
      const userRoleRepository = transactionalEntityManager.getRepository(UserRole);

      let tenant = await tenantRepository.findOne({
        where: { name: tenantName },
      });

      if (!tenant) {
        const countries = await transactionalEntityManager
          .getRepository(Country)
          .find({ order: { id: 'ASC' }, take: 1 });
        const country = countries[0];
        if (!country) {
          throw new Error('No seeded country found for address seeding');
        }
        const states = await transactionalEntityManager.getRepository(State).find({
          where: { countryId: country.id },
          order: { id: 'ASC' },
          take: 1,
        });
        const state = states[0];
        if (!state) {
          throw new Error('No seeded state found for address seeding');
        }
        const cities = await transactionalEntityManager.getRepository(City).find({
          where: { stateId: state.id },
          order: { id: 'ASC' },
          take: 1,
        });
        const city = cities[0];
        if (!city) {
          throw new Error('No seeded city found for address seeding');
        }

        const addressRepo = transactionalEntityManager.getRepository(Address);
        let address = addressRepo.create({
          addressLine1: 'SG Road',
          addressLine2: 'SG Highway',
          countryId: country.id,
          stateId: state.id,
          cityId: city.id,
          postalCode: '380054',
        });
        address = await addressRepo.save(address);

        tenant = tenantRepository.create({
          name: tenantName,
          slug: 'tatvasoft',
          addressId: address.id,
        });
        tenant = await tenantRepository.save(tenant);
      }

      let role = await roleRepository.findOne({
        where: {
          name: PlatformRoleCodes.TENANT_ADMIN,
          tenantId: tenant.id,
        },
      });

      if (!role) {
        role = roleRepository.create({
          name: PlatformRoleCodes.TENANT_ADMIN,
          tenantId: tenant.id,
        });
        role = await roleRepository.save(role);
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

      const pageAccessRepository = transactionalEntityManager.getRepository(PageAccess);
      const rolePageRightRepository = transactionalEntityManager.getRepository(RolePageRight);

      const pageAccesses = await pageAccessRepository.find();
      for (const pageAccess of pageAccesses) {
        let rolePageRight = await rolePageRightRepository.findOne({
          where: {
            roleId: role.id,
            pageAccessId: pageAccess.id,
          },
        });

        if (!rolePageRight) {
          rolePageRight = rolePageRightRepository.create({
            roleId: role.id,
            pageAccessId: pageAccess.id,
          });
          await rolePageRightRepository.save(rolePageRight);
        }
      }
    });
  }
}
