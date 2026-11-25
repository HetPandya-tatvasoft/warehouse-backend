import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import { ProductAttributeConfigValue } from '../entities/product-attribute-config-value.entity';

@Injectable()
export class ProductAttributeConfigValueRepository extends BaseRepository<ProductAttributeConfigValue> {
  constructor(
    @InjectRepository(ProductAttributeConfigValue)
    repository: Repository<ProductAttributeConfigValue>,
  ) {
    super(ProductAttributeConfigValue, repository);
  }

  async findCodesByProductId(
    productId: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<Array<{ attributeValueId: string; code: string | null }>> {
    return this.find(
      {
        where: { productId, tenantId },
        select: { attributeValueId: true, code: true },
      },
      manager,
    );
  }
}
