import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '@/common/constants/messages.constants';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: VALIDATION_MESSAGES.USER.PASSWORD_LENGTH })
  @MaxLength(100)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  lastName!: string;

  @IsArray()
  @ArrayMinSize(1, { message: VALIDATION_MESSAGES.USER.ASSIGNED_ROLES })
  @IsUUID('4', { each: true, message: VALIDATION_MESSAGES.USER.ROLE_ID_UUID })
  roleIds!: string[];

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one branch must be assigned' })
  @IsUUID('4', { each: true, message: 'Branch IDs must be valid UUIDs' })
  branchIds!: string[];

  @IsUUID('4', { message: 'Primary branch ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Primary branch ID is required' })
  primaryBranchId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
