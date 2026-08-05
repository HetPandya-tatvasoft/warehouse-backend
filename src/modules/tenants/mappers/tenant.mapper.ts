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
  country?: {
    id: number;
    name: string;
    code: string;
  };
  state?: {
    id: number;
    name: string;
    code: string;
    countryId: number;
  };
  city?: {
    id: number;
    name: string;
    stateId: number;
  };
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
      addressLine1: tenant.address?.addressLine1,
      addressLine2: tenant.address?.addressLine2,
      country: tenant.address?.country
        ? {
            id: tenant.address.country.id,
            name: tenant.address.country.name,
            code: tenant.address.country.code,
          }
        : undefined,
      state: tenant.address?.state
        ? {
            id: tenant.address.state.id,
            name: tenant.address.state.name,
            code: tenant.address.state.code,
            countryId: tenant.address.state.countryId,
          }
        : undefined,
      city: tenant.address?.city
        ? {
            id: tenant.address.city.id,
            name: tenant.address.city.name,
            stateId: tenant.address.city.stateId,
          }
        : undefined,
      postalCode: tenant.address?.postalCode,
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
