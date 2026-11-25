import { IsNotEmpty, IsUUID } from 'class-validator';

export class NewDynamicValueAssignmentDto {
  @IsUUID('4', { message: 'attributeId must be a valid UUID' })
  @IsNotEmpty({ message: 'attributeId is required' })
  attributeId!: string;

  @IsUUID('4', { message: 'valueId must be a valid UUID' })
  @IsNotEmpty({ message: 'valueId is required' })
  valueId!: string;
}
