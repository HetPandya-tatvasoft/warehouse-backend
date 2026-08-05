import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { State } from './state.entity';

@Entity('countries')
@Index(['code'], { unique: true })
export class Country {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @OneToMany(() => State, (state) => state.country)
  states: State[];
}
