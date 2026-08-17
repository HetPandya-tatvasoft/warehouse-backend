import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ProductCategoryStatus } from '../enums/categoryStatus.enum';
import { AuditableEntity } from '@/common/entities/auditable.entity';

@Entity('product_categories')
export class ProductCategory extends AuditableEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ProductCategoryStatus,
    default: ProductCategoryStatus.ACTIVE,
  })
  status: ProductCategoryStatus;

  @ManyToOne(() => ProductCategory, (category) => category.children, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: ProductCategory | null;

  @OneToMany(() => ProductCategory, (category) => category.parent)
  children: ProductCategory[];
}
