import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Country } from './country.entity';
import { City } from './city.entity';

@Entity('states')
@Index(['countryId', 'name'], { unique: true })
@Index(['countryId', 'code'], { unique: true })
export class State {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'bigint' })
  countryId: number;

  @ManyToOne(() => Country, (country) => country.states, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'countryId' })
  country: Country;

  @OneToMany(() => City, (city) => city.state)
  cities: City[];
}
