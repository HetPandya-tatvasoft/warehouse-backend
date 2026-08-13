import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/auditable.entity';
import { User } from '../../users/entities/user.entity';
import { WarehouseContact } from './warehouse-contact.entity';

@Entity({
  name: 'contacts',
})
export class Contact extends AuditableEntity {
  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: true,
  })
  userId?: string | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 150,
  })
  fullName!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email?: string | null;

  @Column({
    type: 'varchar',
    length: 20,
  })
  phone!: string;

  @OneToMany(() => WarehouseContact, (warehouseContact) => warehouseContact.contact)
  warehouseContacts!: WarehouseContact[];
}
