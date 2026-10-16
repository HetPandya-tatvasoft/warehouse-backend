import { AttributeResponseDto } from '../dto/attribute/attribute-response.dto';
import type { ProductAttribute } from '../entities/attribute.entity';

export class AttributeMapper {
  static toResponseDto(attribute: ProductAttribute, valueCount: number): AttributeResponseDto {
    const dto = new AttributeResponseDto();
    dto.id = attribute.id;
    dto.tenantId = attribute.tenantId;
    dto.name = attribute.name;
    dto.status = attribute.status;
    dto.createdAt = attribute.createdAt;
    dto.updatedAt = attribute.updatedAt;
    dto.valueCount = valueCount;
    return dto;
  }
}
