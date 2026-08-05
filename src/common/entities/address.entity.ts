import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Country } from '../../modules/reference-data/entities/country.entity';
import { State } from '../../modules/reference-data/entities/state.entity';
import { City } from '../../modules/reference-data/entities/city.entity';

@Entity({
  name: 'addresses',
})
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'address_line_1',
    type: 'varchar',
    length: 255,
  })
  addressLine1!: string;

  @Column({
    name: 'address_line_2',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  addressLine2?: string;

  @Column({
    name: 'country_id',
    type: 'bigint',
  })
  countryId!: number;

  @Column({
    name: 'state_id',
    type: 'bigint',
  })
  stateId!: number;

  @Column({
    name: 'city_id',
    type: 'bigint',
  })
  cityId!: number;

  @Column({
    name: 'postal_code',
    type: 'varchar',
    length: 20,
  })
  postalCode!: string;

  @ManyToOne(() => Country, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'country_id' })
  country?: Country;

  @ManyToOne(() => State, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'state_id' })
  state?: State;

  @ManyToOne(() => City, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'city_id' })
  city?: City;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt!: Date;
}
