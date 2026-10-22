import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class AssignCategoryAttributesDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'attributeIds must contain at least one attribute UUID.' })
  @IsUUID('4', { each: true, message: 'Each attributeId must be a valid UUID v4.' })
  @ArrayUnique({ message: 'attributeIds must not contain duplicate entries.' })
  attributeIds!: string[];
}
