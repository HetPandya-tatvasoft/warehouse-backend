import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { State } from '../entities/state.entity';

@Injectable()
export class StateRepository extends BaseRepository<State> {
  constructor(
    @InjectRepository(State)
    repository: Repository<State>,
  ) {
    super(State, repository);
  }
}
