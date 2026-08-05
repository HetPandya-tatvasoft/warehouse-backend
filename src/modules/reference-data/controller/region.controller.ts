import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RegionService } from '../services/region.service';
import { StateQueryDto, CityQueryDto } from '../dto/region-query.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ApiResponseUtil } from '@/common/utils/api-response.util';
import { MESSAGES } from '@/common/constants/messages.constants';

@Controller('regions')
@UseGuards(JWTAuthGuard)
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Get('countries')
  async getCountries() {
    const countries = await this.regionService.getCountries();
    return ApiResponseUtil.success(countries, MESSAGES.REGION.FETCH_COUNTRIES_SUCCESS);
  }

  @Get('states')
  async getStates(@Query() query: StateQueryDto) {
    const states = await this.regionService.getStates(query.countryId);
    return ApiResponseUtil.success(states, MESSAGES.REGION.FETCH_STATES_SUCCESS);
  }

  @Get('cities')
  async getCities(@Query() query: CityQueryDto) {
    const cities = await this.regionService.getCities(query.stateId);
    return ApiResponseUtil.success(cities, MESSAGES.REGION.FETCH_CITIES_SUCCESS);
  }
}
