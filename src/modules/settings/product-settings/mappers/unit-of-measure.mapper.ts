import { UnitOfMeasureResponseDto } from '../dto/unit-of-measure/unit-of-measure-response.dto';
import type { UnitOfMeasure } from '../entities/unit-of-measure.entity';

export class UnitOfMeasureMapper {
  static toResponseDto(entity: UnitOfMeasure): UnitOfMeasureResponseDto {
    const dto = new UnitOfMeasureResponseDto();
    dto.id = entity.id;
    dto.tenantId = entity.tenantId;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.allowsFractionalQuantity = entity.allowsFractionalQuantity;
    dto.status = entity.status;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
