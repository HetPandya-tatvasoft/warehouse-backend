import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UserRepository } from './repositories/user.repository';
import { UserRoleRepository } from './repositories/user-role.repository';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';
import { MailModule } from '../mail/mail.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole]), RolesAndPermissionsModule, MailModule, BranchesModule],
  controllers: [UserController],
  providers: [UserRepository, UserRoleRepository, UserService],
  exports: [UserRepository, UserRoleRepository, UserService, TypeOrmModule],
})
export class UsersModule {}
