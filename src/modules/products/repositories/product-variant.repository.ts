import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';

import { BaseRepository } from '@/common/repositories/base.repository';
import type { IPaginatedResponse } from '@/common/types/api-response.interface';
import { ProductVariant } from '../entities/product-variant.entity';
import { VariantStatus } from '../enums/product.enums';

interface RefRow {
  table_name: string;
  column_name: string;
}

@Injectable()
export class ProductVariantRepository extends BaseRepository<ProductVariant> {
  constructor(@InjectRepository(ProductVariant) repository: Repository<ProductVariant>) {
    super(ProductVariant, repository);
  }

  async findBySku(tenantId: string, sku: string, manager?: EntityManager): Promise<ProductVariant | null> {
    return this.findOne({ where: { tenantId, sku } }, manager);
  }

  async findPaginatedByProductId(
    tenantId: string,
    productId: string,
    page: number = 1,
    pageSize: number = 10,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<ProductVariant>> {
    return this.findAndCountPaginated(
      page,
      pageSize,
      {
        where: { tenantId, productId },
        relations: {
          variantAttributeValues: {
            attribute: true,
            attributeValue: true,
          },
        },
        order: {
          createdAt: 'ASC',
          id: 'ASC',
        },
      },
      manager,
    );
  }

  async findByProductId(tenantId: string, productId: string, manager?: EntityManager): Promise<ProductVariant[]> {
    return this.find(
      {
        where: { tenantId, productId },
        relations: {
          variantAttributeValues: {
            attribute: true,
            attributeValue: true,
          },
        },
        order: {
          createdAt: 'ASC',
        },
      },
      manager,
    );
  }

  async countByProductId(tenantId: string, productId: string, manager?: EntityManager): Promise<number> {
    return this.count(
      {
        where: { tenantId, productId },
      },
      manager,
    );
  }

  async countActiveByProductId(tenantId: string, productId: string, manager?: EntityManager): Promise<number> {
    return this.count(
      {
        where: { tenantId, productId, status: VariantStatus.ACTIVE },
      },
      manager,
    );
  }

  async hasExternalReferences(variantId: string, manager?: EntityManager): Promise<boolean> {
    const refTables = await this.getRepository(manager).query<RefRow[]>(
      `SELECT tc.table_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu 
           ON tc.constraint_name = kcu.constraint_name 
           AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu 
           ON ccu.constraint_name = tc.constraint_name 
           AND ccu.table_schema = tc.table_schema
         WHERE ccu.table_name = 'product_variants'
           AND tc.table_name != 'product_variant_attribute_values'
           AND tc.constraint_type = 'FOREIGN KEY'`,
    );

    for (const ref of refTables) {
      const tableName = ref.table_name.replace(/[^a-zA-Z0-9_]/g, '');
      const columnName = ref.column_name.replace(/[^a-zA-Z0-9_]/g, '');
      const rows = await this.getRepository(manager).query<Array<Record<string, unknown>>>(
        `SELECT 1 FROM "${tableName}" WHERE "${columnName}" = $1 LIMIT 1`,
        [variantId],
      );
      if (rows.length > 0) {
        return true;
      }
    }
    return false;
  }
}
