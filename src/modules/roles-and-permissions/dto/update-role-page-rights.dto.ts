import { IsArray, IsUUID } from 'class-validator';

export class UpdateRolePageRightsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  pageAccessIds!: string[];
}
