import { IsUUID } from 'class-validator';

export class SwitchBranchDto {
  @IsUUID('4', { message: 'Invalid branch ID format.' })
  branchId!: string;
}
