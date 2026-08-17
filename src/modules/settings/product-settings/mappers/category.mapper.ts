import type { ProductCategory } from '../entities/category.entity';
import { CategoryResponseDto } from '../dto/category/category-response.dto';

export class CategoryMapper {
  static toResponseDto(category: ProductCategory): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.tenantId = category.tenantId;
    dto.name = category.name;
    dto.description = category.description;
    dto.status = category.status;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    return dto;
  }
}
