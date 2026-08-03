import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantBranchRepository } from '../repositories/tenant-branch.repository';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BranchPaginationQueryDto } from '../dto/branch-pagination.dto';
import { TenantBranch } from '../entities/tenant-branch.entity';
import { ICurrentUserData } from '@/modules/auth/types/jwt-payload.interface';
import { IPaginatedResponse } from '@/common/types/api-response.interface';
import { MESSAGES } from '@/common/constants/messages.constants';
import { UserBranchRepository } from '../repositories/user-branch.repository';
import { BranchStatus } from '../enums/branch-status.enum';

@Injectable()
export class BranchesService {
  constructor(
    private readonly tenantBranchRepository: TenantBranchRepository,
    private readonly userBranchRepository: UserBranchRepository,
  ) {}

  async createBranch(createBranchDto: CreateBranchDto, currentUser: ICurrentUserData): Promise<TenantBranch> {
    if (!currentUser.tenantId) {
      throw new BadRequestException(MESSAGES.BRANCH.TENANT_REQUIRED);
    }

    const existingBranch = await this.tenantBranchRepository.findOne({
      where: {
        name: createBranchDto.name,
        tenantId: currentUser.tenantId,
        isDeleted: false,
      },
    });

    if (existingBranch) {
      throw new ConflictException(MESSAGES.BRANCH.NAME_EXISTS);
    }

    const branch = this.tenantBranchRepository.create({
      name: createBranchDto.name,
      status: createBranchDto.status,
      tenantId: currentUser.tenantId,
      addressLine1: createBranchDto.addressLine1,
      addressLine2: createBranchDto.addressLine2,
      city: createBranchDto.city,
      state: createBranchDto.state,
      country: createBranchDto.country,
      postalCode: createBranchDto.postalCode,
    });
    return this.tenantBranchRepository.save(branch);
  }

  async getBranchById(id: string, currentUser: ICurrentUserData): Promise<TenantBranch> {
    if (!currentUser.tenantId) {
      throw new BadRequestException(MESSAGES.BRANCH.TENANT_REQUIRED);
    }

    const branch = await this.tenantBranchRepository.findOne({
      where: {
        id: id,
        tenantId: currentUser.tenantId,
        isDeleted: false,
      },
    });
    if (!branch) {
      throw new NotFoundException(MESSAGES.BRANCH.NOT_FOUND);
    }

    return branch;
  }

  async getBranchesPaginated(
    currentUser: ICurrentUserData,
    query: BranchPaginationQueryDto,
  ): Promise<IPaginatedResponse<TenantBranch>> {
    if (!currentUser.tenantId) {
      throw new BadRequestException(MESSAGES.BRANCH.TENANT_REQUIRED);
    }

    const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', search, status } = query;

    return this.tenantBranchRepository.findPaginated(
      currentUser.tenantId,
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
      status,
    );
  }

  async updateBranch(
    id: string,
    updateBranchDto: UpdateBranchDto,
    currentUser: ICurrentUserData,
  ): Promise<TenantBranch> {
    if (!currentUser.tenantId) {
      throw new BadRequestException(MESSAGES.BRANCH.TENANT_REQUIRED);
    }

    const branch = await this.tenantBranchRepository.findByIdAndTenant(id, currentUser.tenantId);
    if (!branch) {
      throw new NotFoundException(MESSAGES.BRANCH.NOT_FOUND);
    }

    if (updateBranchDto.name && updateBranchDto.name !== branch.name) {
      const existingBranch = await this.tenantBranchRepository.findByNameAndTenant(
        updateBranchDto.name,
        currentUser.tenantId,
      );

      if (existingBranch && existingBranch.id !== id) {
        throw new ConflictException(MESSAGES.BRANCH.NAME_EXISTS);
      }
    }

    branch.name = updateBranchDto.name ?? branch.name;
    branch.status = updateBranchDto.status ?? branch.status;
    branch.addressLine1 = updateBranchDto.addressLine1;
    branch.addressLine2 = updateBranchDto.addressLine2;
    branch.city = updateBranchDto.city;
    branch.state = updateBranchDto.state;
    branch.country = updateBranchDto.country;
    branch.postalCode = updateBranchDto.postalCode;

    return this.tenantBranchRepository.save(branch);
  }

  async deleteBranch(id: string, currentUser: ICurrentUserData): Promise<void> {
    if (!currentUser.tenantId) {
      throw new BadRequestException(MESSAGES.BRANCH.TENANT_REQUIRED);
    }

    const branch = await this.tenantBranchRepository.findByIdAndTenant(id, currentUser.tenantId);
    if (!branch) {
      throw new NotFoundException(MESSAGES.BRANCH.NOT_FOUND);
    }

    const userAssignments = await this.userBranchRepository.find({
      where: {
        branchId: id,
        user: {
          isActive: true,
        },
      },
      relations: {
        user: true,
      },
    });

    if (userAssignments.length > 0) {
      throw new BadRequestException(MESSAGES.BRANCH.CANNOT_DELETE_ASSIGNED);
    }

    if (branch.status === BranchStatus.ACTIVE) {
      const activeBranchesCount = await this.tenantBranchRepository.getRepository().count({
        where: {
          tenantId: currentUser.tenantId,
          isDeleted: false,
          status: BranchStatus.ACTIVE,
        },
      });

      if (activeBranchesCount <= 1) {
        throw new BadRequestException(MESSAGES.BRANCH.CANNOT_DELETE_LAST_ACTIVE);
      }
    }

    branch.isDeleted = true;
    await this.tenantBranchRepository.save(branch);
  }
}
