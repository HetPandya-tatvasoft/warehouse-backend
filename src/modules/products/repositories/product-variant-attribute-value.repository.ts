import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import { ProductVariantAttributeValue } from '../entities/product-variant-attribute-value.entity';

@Injectable()
export class ProductVariantAttributeValueRepository extends BaseRepository<ProductVariantAttributeValue> {
  constructor(
    @InjectRepository(ProductVariantAttributeValue)
    repository: Repository<ProductVariantAttributeValue>,
  ) {
    super(ProductVariantAttributeValue, repository);
  }

  async deleteByVariantId(variantId: string, manager?: EntityManager): Promise<void> {
    await this.delete({ variantId }, manager);
  }
}
