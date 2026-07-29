import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '@/common/constants/messages.constants';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: VALIDATION_MESSAGES.USER.ASSIGNED_ROLES })
  @IsUUID('4', { each: true, message: VALIDATION_MESSAGES.USER.ROLE_ID_UUID })
  roleIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
