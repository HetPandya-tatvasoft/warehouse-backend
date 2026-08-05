import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Address } from '../entities/address.entity';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
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
    const repo = manager ? manager.getRepository(Address) : this.addressRepository;
    await repo.update(addressId, data);
    return repo.findOneOrFail({ where: { id: addressId } });
  }
}
