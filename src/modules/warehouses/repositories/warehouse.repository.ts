import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class WarehouseRepository extends BaseRepository<Warehouse> {
  constructor(
    @InjectRepository(Warehouse)
    repository: Repository<Warehouse>,
  ) {
    super(Warehouse, repository);
  }
}
