import { ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { TenantRepository } from '../repositories/tenant.repository';
import { TenantOnboardingDto } from '../dto/tenant-onboarding.dto';
import { TenantPaginationQueryDto } from '../dto/tenant-pagination.dto';
import { Tenant } from '../entities/tenant.entity';
import { TenantStatus } from '../enums/tenant-status.enum';
import { PageAccess } from '../../roles-and-permissions/entities/page-access.entity';
import { User } from '../../users/entities/user.entity';
import { UserRepository } from '../../users/repositories/user.repository';
import { RoleRepository } from '../../roles-and-permissions/repositories/role.repository';
import { RolePageRightRepository } from '../../roles-and-permissions/repositories/role-page-right.repository';
import { PlatformRoleCodes } from '../../../common/enums/role.enum';
import { MailService } from '../../mail/services/mail.service';
import { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { IPaginatedResponse } from '@/common/types/api-response.interface';
import { TenantMapper, ITenantResponseDto } from '../mappers/tenant.mapper';
import { AUTH_CONSTANTS } from '@/common/constants/auth.constants';
import { EMAIL_TEMPLATES } from '../../mail/templates/email-templates';
import { MESSAGES } from '@/common/constants/messages.constants';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly rolePageRightRepository: RolePageRightRepository,
    @InjectRepository(PageAccess)
    private readonly pageAccessRepository: Repository<PageAccess>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async onboard(dto: TenantOnboardingDto, user: ICurrentUserData) {
    if (user.tenantId !== null || !user.roles.includes(PlatformRoleCodes.PLATFORM_SUPER_ADMIN)) {
      throw new ForbiddenException(MESSAGES.TENANT.ACCESS_DENIED);
    }

    const existingTenant = await this.tenantRepository.findBySlug(dto.slug, { includeDeleted: true });
    if (existingTenant) {
      throw new ConflictException(MESSAGES.TENANT.SLUG_EXISTS);
    }

    const existingUser = await this.userRepository.findByEmail(dto.primaryAdministrator.email);
    if (existingUser) {
      throw new ConflictException(MESSAGES.TENANT.EMAIL_EXISTS);
    }

    // Fetch active PageAccess records to assign default permissions
    const activePageAccesses = await this.pageAccessRepository.find({
      where: {
        page: { isDeleted: false },
        accessType: { isDeleted: false },
      },
      relations: { page: true, accessType: true },
    });
    const pageAccessIds = activePageAccesses.map((pa) => pa.id);

    let tempPassword = '';
    let savedTenant: Tenant;
    let savedUser: User;

    await this.dataSource.transaction(async (manager) => {
      savedTenant = await this.tenantRepository.createTenant(
        {
          name: dto.companyName,
          slug: dto.slug,
          status: TenantStatus.ACTIVE,
          companyEmail: dto.companyEmail,
          companyPhone: dto.companyPhone,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          postalCode: dto.postalCode,
          isDeleted: false,
        },
        manager,
      );

      // Create Tenant Admin Role
      const savedRole = await this.roleRepository.createRole(
        {
          name: PlatformRoleCodes.TENANT_ADMIN,
          tenantId: savedTenant.id,
          description: 'Tenant Administrator',
          isDeleted: false,
        },
        manager,
      );

      // default permissions
      if (pageAccessIds.length > 0) {
        await this.rolePageRightRepository.bulkInsert(savedRole.id, pageAccessIds, manager);
      }

      // temporary password
      tempPassword = this.generateSecurePassword();
      const passwordHash = await bcrypt.hash(tempPassword, AUTH_CONSTANTS.HASH_SALT_ROUNDS);

      //Create Primary Administrator User and assign role
      savedUser = await this.userRepository.createUserWithRoles(
        {
          tenantId: savedTenant.id,
          email: dto.primaryAdministrator.email,
          passwordHash,
          firstName: dto.primaryAdministrator.firstName,
          lastName: dto.primaryAdministrator.lastName,
          isActive: true,
        },
        [savedRole.id],
        manager,
      );
    });

    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;

    try {
      await this.mailService.send({
        to: dto.primaryAdministrator.email,
        ...EMAIL_TEMPLATES.tenantOnboarding(
          dto.primaryAdministrator.firstName,
          dto.primaryAdministrator.lastName,
          dto.companyName,
          loginUrl,
          dto.primaryAdministrator.email,
          tempPassword,
        ),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send onboarding email to ${dto.primaryAdministrator.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return {
      tenantId: savedTenant!.id,
      tenantName: savedTenant!.name,
      primaryAdministratorEmail: savedUser!.email,
      temporaryPassword: tempPassword,
    };
  }

  async getTenants(
    query: TenantPaginationQueryDto,
    user: ICurrentUserData,
  ): Promise<IPaginatedResponse<ITenantResponseDto>> {
    if (user.tenantId !== null || !user.roles.includes(PlatformRoleCodes.PLATFORM_SUPER_ADMIN)) {
      throw new ForbiddenException(MESSAGES.TENANT.ACCESS_DENIED);
    }

    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = query;

    const [tenants, totalItems] = await this.tenantRepository.findPaginated(
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
      status,
    );

    return {
      items: tenants.map((tenant) => TenantMapper.toTenantResponseDto(tenant)),
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }

  private generateSecurePassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+';
    const all = uppercase + lowercase + numbers + symbols;

    let password = '';

    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];

    for (let i = 4; i < 16; i++) {
      password += all[crypto.randomInt(0, all.length)];
    }

    // Shuffling the generated password
    return password
      .split('')
      .sort(() => crypto.randomInt(-1, 2))
      .join('');
  }
}
