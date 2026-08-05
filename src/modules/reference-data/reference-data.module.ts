import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/country.entity';
import { State } from './entities/state.entity';
import { City } from './entities/city.entity';
import { CountryRepository } from './repositories/country.repository';
import { StateRepository } from './repositories/state.repository';
import { CityRepository } from './repositories/city.repository';
import { RegionService } from './services/region.service';
import { RegionController } from './controller/region.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Country, State, City])],
  controllers: [RegionController],
  providers: [CountryRepository, StateRepository, CityRepository, RegionService],
  exports: [CountryRepository, StateRepository, CityRepository, RegionService, TypeOrmModule],
})
export class ReferenceDataModule {}
