import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { State } from './state.entity';

@Entity('cities')
@Index(['stateId', 'name'], { unique: true })
export class City {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'bigint' })
  stateId: number;

  @ManyToOne(() => State, (state) => state.cities, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'stateId' })
  state: State;
}
