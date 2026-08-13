import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Contact } from '../entities/contact.entity';

@Injectable()
export class ContactRepository extends BaseRepository<Contact> {
  constructor(
    @InjectRepository(Contact)
    repository: Repository<Contact>,
  ) {
    super(Contact, repository);
  }

  async searchTenantContacts(searchTerm: string, tenantId: string | null, limit = 100): Promise<Contact[]> {
    const searchPattern = searchTerm ? ILike(`%${searchTerm}%`) : undefined;
    const where = searchPattern
      ? [
          { fullName: searchPattern, user: { tenantId: tenantId ?? IsNull() } },
          { fullName: searchPattern, warehouseContacts: { warehouse: { branch: { tenantId: tenantId ?? IsNull() } } } },
          { email: searchPattern, user: { tenantId: tenantId ?? IsNull() } },
          { email: searchPattern, warehouseContacts: { warehouse: { branch: { tenantId: tenantId ?? IsNull() } } } },
          { phone: searchPattern, user: { tenantId: tenantId ?? IsNull() } },
          { phone: searchPattern, warehouseContacts: { warehouse: { branch: { tenantId: tenantId ?? IsNull() } } } },
        ]
      : [
          { user: { tenantId: tenantId ?? IsNull() } },
          { warehouseContacts: { warehouse: { branch: { tenantId: tenantId ?? IsNull() } } } },
        ];

    return this.find({
      relations: {
        user: true,
        warehouseContacts: {
          warehouse: {
            branch: true,
          },
        },
      },
      where,
      take: limit,
    });
  }
}
