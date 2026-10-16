import { AttributeValueResponseDto } from '../dto/attribute-value/attribute-value-response.dto';
import type { ProductAttribute } from '../entities/attribute.entity';
import type { ProductAttributeValue } from '../entities/attribute-value.entity';
import { AttributeStatus } from '../enums/attribute-status.enum';

export class AttributeValueMapper {
  static toResponseDto(value: ProductAttributeValue, parent: ProductAttribute): AttributeValueResponseDto {
    const dto = new AttributeValueResponseDto();
    dto.id = value.id;
    dto.attributeId = value.attributeId;
    dto.label = value.label;
    dto.status = value.status;
    dto.createdAt = value.createdAt;
    dto.updatedAt = value.updatedAt;
    dto.isAvailableForSelection = parent.status === AttributeStatus.ACTIVE && value.status === AttributeStatus.ACTIVE;
    return dto;
  }
}
