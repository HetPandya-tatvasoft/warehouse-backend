import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import { ProductAttributeConfig } from '../entities/product-attribute-config.entity';

@Injectable()
export class ProductAttributeConfigRepository extends BaseRepository<ProductAttributeConfig> {
  constructor(@InjectRepository(ProductAttributeConfig) repository: Repository<ProductAttributeConfig>) {
    super(ProductAttributeConfig, repository);
  }
}
