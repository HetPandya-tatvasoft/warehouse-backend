export class AuthUserDto {
  userId!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  roles!: string[];
  tenantId!: string | null;
}
