import type { Tenant } from '../entities/tenant.entity';
import type { User } from '../../users/entities/user.entity';

export interface ITenantResponseDto {
  id: string;
  name: string;
  slug: string;
  status: string;
  companyEmail?: string;
  companyPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  createdAt: Date;
  updatedAt: Date;
  primaryAdmin?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ITenantWithAdmin extends Tenant {
  primaryAdmin?: User;
}

export class TenantMapper {
  static toTenantResponseDto(tenant: ITenantWithAdmin): ITenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      companyEmail: tenant.companyEmail,
      companyPhone: tenant.companyPhone,
      addressLine1: tenant.addressLine1,
      addressLine2: tenant.addressLine2,
      city: tenant.city,
      state: tenant.state,
      country: tenant.country,
      postalCode: tenant.postalCode,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      primaryAdmin: tenant.primaryAdmin
        ? {
            firstName: tenant.primaryAdmin.firstName,
            lastName: tenant.primaryAdmin.lastName,
            email: tenant.primaryAdmin.email,
          }
        : undefined,
    };
  }
}
