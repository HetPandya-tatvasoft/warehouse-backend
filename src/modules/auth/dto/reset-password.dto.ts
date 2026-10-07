import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '@/common/constants/messages.constants';
import { AUTH_CONSTANTS } from '@/common/constants/auth.constants';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: VALIDATION_MESSAGES.USER.PASSWORD_LENGTH })
  @MaxLength(100, { message: VALIDATION_MESSAGES.USER.PASSWORD_LENGTH })
  @Matches(AUTH_CONSTANTS.PASSWORD_REGEX, {
    message: VALIDATION_MESSAGES.USER.PASSWORD_COMPLEXITY,
  })
  password!: string;
}
