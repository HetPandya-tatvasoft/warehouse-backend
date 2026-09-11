import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Address } from '../entities/address.entity';
import { RegionService } from '../../modules/reference-data/services/region.service';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly regionService: RegionService,
  ) {}

  async createAddress(
    data: {
      addressLine1: string;
      addressLine2?: string;
      countryId: number;
      stateId: number;
      cityId: number;
      postalCode: string;
    },
    manager?: EntityManager,
  ): Promise<Address> {
    await this.regionService.validateAddress(data.countryId, data.stateId, data.cityId);
    const repo = manager ? manager.getRepository(Address) : this.addressRepository;
    const address = repo.create(data);
    return repo.save(address);
  }

  async updateAddress(
    addressId: string,
    data: {
      addressLine1?: string;
      addressLine2?: string;
      countryId?: number;
      stateId?: number;
      cityId?: number;
      postalCode?: string;
    },
    manager?: EntityManager,
  ): Promise<Address> {
    if (data.countryId !== undefined && data.stateId !== undefined && data.cityId !== undefined) {
      await this.regionService.validateAddress(data.countryId, data.stateId, data.cityId);
    }
    const repo = manager ? manager.getRepository(Address) : this.addressRepository;
    await repo.update(addressId, data);
    return repo.findOneOrFail({ where: { id: addressId } });
  }
}
