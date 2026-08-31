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

  // Map to track duplicate state redirects: key = duplicateStateId, value = primaryStateId
  private readonly stateRedirectMap = new Map<number, number>();

  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const countryRepository = this.dataSource.getRepository(Country);
    const stateRepository = this.dataSource.getRepository(State);
    const cityRepository = this.dataSource.getRepository(City);

    // Check if tables are already fully populated to prevent skipping during partial seeds
    const hasCountries = await countryRepository.exists();
    const hasStates = await stateRepository.exists();
    const hasCities = await cityRepository.exists();

    if (hasCountries && hasStates && hasCities) {
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
    const filePath = path.join(__dirname, '../datasets/countries+states+cities.json');
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

    // Unique keys tracking for unique constraints ['countryId', 'name'] and ['countryId', 'code']
    const seenNames = new Set<string>();
    const seenCodes = new Set<string>();

    const stateNameMap = new Map<string, number>();
    const stateCodeMap = new Map<string, number>();

    for (const country of countriesData) {
      if (country.states) {
        for (const state of country.states) {
          const stateCode = state.iso2;
          if (!stateCode) {
            throw new Error(
              `Missing ISO2 code for state "${state.name}" (ID: ${state.id}) in country "${country.name}".`,
            );
          }

          const nameKey = `${country.id}_${state.name.toLowerCase()}`;
          const codeKey = `${country.id}_${stateCode.toLowerCase()}`;

          // If duplicate name/code in country, redirect child cities to the primary state ID
          if (seenNames.has(nameKey)) {
            const primaryId = stateNameMap.get(nameKey)!;
            this.stateRedirectMap.set(state.id, primaryId);
            continue;
          }
          if (seenCodes.has(codeKey)) {
            const primaryId = stateCodeMap.get(codeKey)!;
            this.stateRedirectMap.set(state.id, primaryId);
            continue;
          }

          seenNames.add(nameKey);
          seenCodes.add(codeKey);
          stateNameMap.set(nameKey, state.id);
          stateCodeMap.set(codeKey, state.id);

          statesToInsert.push({
            id: state.id,
            name: state.name,
            code: stateCode,
            countryId: country.id,
          });
        }
      }
    }
    return statesToInsert;
  }

  private extractCities(countriesData: ICountryItem[]): QueryDeepPartialEntity<City>[] {
    const citiesToInsert: QueryDeepPartialEntity<City>[] = [];
    const seenCityNames = new Set<string>(); // composite key stateId_cityName

    for (const country of countriesData) {
      if (country.states) {
        for (const state of country.states) {
          if (state.cities) {
            // Resolve to primary state ID if this state was a duplicate
            const resolvedStateId = this.stateRedirectMap.has(state.id)
              ? this.stateRedirectMap.get(state.id)!
              : state.id;

            for (const city of state.cities) {
              const cityKey = `${resolvedStateId}_${city.name.toLowerCase()}`;

              // Skip duplicate cities within the same state to satisfy the unique constraint
              if (seenCityNames.has(cityKey)) {
                continue;
              }
              seenCityNames.add(cityKey);

              citiesToInsert.push({
                id: city.id,
                name: city.name,
                stateId: resolvedStateId,
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
