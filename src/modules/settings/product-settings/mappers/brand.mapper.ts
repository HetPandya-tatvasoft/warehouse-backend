import { BrandResponseDto } from '../dto/brand/brand-response.dto';
import type { ProductBrand } from '../entities/brand.entity';

export class BrandMapper {
  static toResponseDto(brand: ProductBrand): BrandResponseDto {
    const dto = new BrandResponseDto();
    dto.id = brand.id;
    dto.tenantId = brand.tenantId;
    dto.name = brand.name;
    dto.status = brand.status;
    dto.createdAt = brand.createdAt;
    dto.updatedAt = brand.updatedAt;
    return dto;
  }
}
