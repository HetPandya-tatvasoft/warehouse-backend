import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { WarehouseContact } from '../entities/warehouse-contact.entity';

@Injectable()
export class WarehouseContactRepository extends BaseRepository<WarehouseContact> {
  constructor(
    @InjectRepository(WarehouseContact)
    repository: Repository<WarehouseContact>,
  ) {
    super(WarehouseContact, repository);
  }
}
