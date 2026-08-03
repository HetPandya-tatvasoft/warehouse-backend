import type {
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  QueryDeepPartialEntity,
  Repository,
  UpdateResult,
} from 'typeorm';
import type { IPaginatedResponse } from '../types/api-response.interface';

export abstract class BaseRepository<TEntity extends ObjectLiteral> {
  protected constructor(
    protected readonly entity: EntityTarget<TEntity>,
    protected readonly repository: Repository<TEntity>,
  ) {}

  public getRepository(entityManager?: EntityManager): Repository<TEntity> {
    return entityManager ? entityManager.getRepository(this.entity) : this.repository;
  }

  create(entityLike: DeepPartial<TEntity>, entityManager?: EntityManager) {
    return this.getRepository(entityManager).create(entityLike);
  }

  async update(
    criteria: FindOptionsWhere<TEntity>,
    partialEntity: QueryDeepPartialEntity<TEntity>,
    manager?: EntityManager,
  ): Promise<UpdateResult> {
    return this.getRepository(manager).update(criteria, partialEntity);
  }

  async save(entityLike: DeepPartial<TEntity>, entityManager?: EntityManager): Promise<TEntity> {
    return this.getRepository(entityManager).save(entityLike);
  }

  async saveMany(entities: DeepPartial<TEntity>[], entityManager?: EntityManager): Promise<TEntity[]> {
    return this.getRepository(entityManager).save(entities);
  }

  async exists(where: FindOptionsWhere<TEntity>, entityManager?: EntityManager): Promise<boolean> {
    return this.getRepository(entityManager).exists({
      where,
    });
  }

  async findOne(options: FindOneOptions<TEntity>, entityManager?: EntityManager): Promise<TEntity | null> {
    return this.getRepository(entityManager).findOne(options);
  }

  async find(options?: FindManyOptions<TEntity>, entityManager?: EntityManager): Promise<TEntity[]> {
    return this.getRepository(entityManager).find(options);
  }

  async findAndCountPaginated(
    page: number,
    pageSize: number,
    options?: FindManyOptions<TEntity>,
    manager?: EntityManager,
  ): Promise<IPaginatedResponse<TEntity>> {
    const repository = this.getRepository(manager);
    const [items, total] = await repository.findAndCount({
      ...options,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      totalItems: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async delete(criteria: FindOptionsWhere<TEntity>, manager?: EntityManager): Promise<void> {
    await this.getRepository(manager).delete(criteria);
  }
}
