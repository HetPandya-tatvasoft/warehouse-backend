import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { Contact } from './entities/contact.entity';
import { WarehouseContact } from './entities/warehouse-contact.entity';
import { WarehouseRepository } from './repositories/warehouse.repository';
import { ContactRepository } from './repositories/contact.repository';
import { WarehouseContactRepository } from './repositories/warehouse-contact.repository';
import { WarehousesService } from './services/warehouses.service';
import { WarehousesController } from './controllers/warehouses.controller';
import { BranchesModule } from '../branches/branches.module';
import { UsersModule } from '../users/users.module';
import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warehouse, Contact, WarehouseContact]),
    BranchesModule,
    UsersModule,
    RolesAndPermissionsModule,
  ],
  controllers: [WarehousesController],
  providers: [WarehouseRepository, ContactRepository, WarehouseContactRepository, WarehousesService],
  exports: [WarehouseRepository, ContactRepository, WarehouseContactRepository, WarehousesService, TypeOrmModule],
})
export class WarehousesModule {}
