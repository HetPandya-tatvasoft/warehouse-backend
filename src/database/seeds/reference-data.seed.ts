import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Country } from '../../modules/reference-data/entities/country.entity';
import { State } from '../../modules/reference-data/entities/state.entity';
import { City } from '../../modules/reference-data/entities/city.entity';
import { ICountryItem } from '../../modules/reference-data/types/regions.interface';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class ReferenceDataSeeder {
  private static readonly INSERT_CHUNK_SIZE = 5000;

  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const countryRepository = this.dataSource.getRepository(Country);
    const alreadySeeded = await countryRepository.exists();

    if (alreadySeeded) {
      console.log('Reference data is already seeded. So skipping that.');
      return;
    }

    const countriesData = await this.readDataset();

    const countries = this.extractCountries(countriesData);
    const states = this.extractStates(countriesData);
    const cities = this.extractCities(countriesData);

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await this.insertInChunks(transactionalEntityManager, Country, countries);

      await this.insertInChunks(transactionalEntityManager, State, states);

      await this.insertInChunks(transactionalEntityManager, City, cities);
    });
  }

  private async readDataset(): Promise<ICountryItem[]> {
    const filePath = path.join(process.cwd(), 'src/database/datasets/countries+states+cities.json');
    if (!existsSync(filePath)) {
      throw new Error('Reference data file not found.');
    }

    const fileContent = await readFile(filePath, 'utf8');
    const countriesData = JSON.parse(fileContent) as ICountryItem[];
    return countriesData;
  }

  private extractCountries(countriesData: ICountryItem[]): QueryDeepPartialEntity<Country>[] {
    return countriesData.map((country) => {
      if (!country.iso2) {
        throw new Error(`Missing ISO2 code for country "${country.name}" (ID: ${country.id}).`);
      }
      return {
        id: country.id,
        name: country.name,
        code: country.iso2,
      };
    });
  }

  private extractStates(countriesData: ICountryItem[]): QueryDeepPartialEntity<State>[] {
    const statesToInsert: QueryDeepPartialEntity<State>[] = [];
    for (const country of countriesData) {
      if (country.states) {
        for (const state of country.states) {
          if (!state.state_code) {
            throw new Error(
              `Missing state_code for state "${state.name}" (ID: ${state.id}) in country "${country.name}".`,
            );
          }
          statesToInsert.push({
            id: state.id,
            name: state.name,
            code: state.state_code,
            countryId: country.id,
          });
        }
      }
    }
    return statesToInsert;
  }

  private extractCities(countriesData: ICountryItem[]): QueryDeepPartialEntity<City>[] {
    const citiesToInsert: QueryDeepPartialEntity<City>[] = [];
    for (const country of countriesData) {
      if (country.states) {
        for (const state of country.states) {
          if (state.cities) {
            for (const city of state.cities) {
              citiesToInsert.push({
                id: city.id,
                name: city.name,
                stateId: state.id,
              });
            }
          }
        }
      }
    }
    return citiesToInsert;
  }

  private async insertInChunks<T extends ObjectLiteral>(
    manager: EntityManager,
    entityClass: EntityTarget<T>,
    entities: QueryDeepPartialEntity<T>[],
  ): Promise<void> {
    const chunkSize = ReferenceDataSeeder.INSERT_CHUNK_SIZE;
    for (let i = 0; i < entities.length; i += chunkSize) {
      const chunk = entities.slice(i, i + chunkSize);
      await manager.insert(entityClass, chunk);
    }
  }
}
