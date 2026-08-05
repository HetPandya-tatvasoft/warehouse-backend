import { BadRequestException, Injectable } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { CountryRepository } from '../repositories/country.repository';
import { StateRepository } from '../repositories/state.repository';
import { CityRepository } from '../repositories/city.repository';
import { Country } from '../entities/country.entity';
import { State } from '../entities/state.entity';
import { City } from '../entities/city.entity';
import { MESSAGES } from '@/common/constants/messages.constants';

@Injectable()
export class RegionService {
  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly stateRepository: StateRepository,
    private readonly cityRepository: CityRepository,
  ) {}

  async getCountries(): Promise<Country[]> {
    return this.countryRepository.find({ order: { name: 'ASC' } });
  }

  async getStates(countryId?: number): Promise<State[]> {
    const findOptions: FindManyOptions<State> = { order: { name: 'ASC' } };
    if (countryId !== undefined) {
      findOptions.where = { countryId };
    }
    return this.stateRepository.find(findOptions);
  }

  async getCities(stateId?: number): Promise<City[]> {
    const findOptions: FindManyOptions<City> = { order: { name: 'ASC' } };
    if (stateId !== undefined) {
      findOptions.where = { stateId };
    }
    return this.cityRepository.find(findOptions);
  }

  async validateAddress(countryId: number, stateId: number, cityId: number): Promise<void> {
    const country = await this.countryRepository.findOne({ where: { id: countryId } });
    if (!country) {
      throw new BadRequestException(MESSAGES.REGION.COUNTRY_NOT_FOUND);
    }

    const state = await this.stateRepository.findOne({ where: { id: stateId, countryId } });
    if (!state) {
      throw new BadRequestException(MESSAGES.REGION.STATE_NOT_FOUND);
    }

    const city = await this.cityRepository.findOne({ where: { id: cityId, stateId } });
    if (!city) {
      throw new BadRequestException(MESSAGES.REGION.CITY_NOT_FOUND);
    }
  }
}
