import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Country } from '../entities/country.entity';

@Injectable()
export class CountryRepository extends BaseRepository<Country> {
  constructor(
    @InjectRepository(Country)
    repository: Repository<Country>,
  ) {
    super(Country, repository);
  }
}
