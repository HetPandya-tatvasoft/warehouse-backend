import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { Warehouse } from './warehouse.entity';
import { Contact } from './contact.entity';

@Index('uq_warehouse_contacts_warehouse_contact', ['warehouseId', 'contactId'], { unique: true })
@Index('uq_warehouse_contacts_warehouse_default', ['warehouseId'], {
  unique: true,
  where: 'is_default = true',
})
@Entity({
  name: 'warehouse_contacts',
})
export class WarehouseContact extends AuditableEntity {
  @Column({
    name: 'warehouse_id',
    type: 'uuid',
  })
  warehouseId!: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.contacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({
    name: 'contact_id',
    type: 'uuid',
  })
  contactId!: string;

  @ManyToOne(() => Contact, (contact) => contact.warehouseContacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contact_id' })
  contact!: Contact;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
  })
  isDefault!: boolean;
}
