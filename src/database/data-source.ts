import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { Role } from '../modules/roles-and-permissions/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../modules/users/entities/user-role.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { Permission } from '../modules/roles-and-permissions/entities/permission.entity';
import { Page } from '../modules/roles-and-permissions/entities/page.entity';
import { PageAccess } from '../modules/roles-and-permissions/entities/page-access.entity';
import { RolePageRight } from '../modules/roles-and-permissions/entities/role-page-right.entity';

const AppDataSource = new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  synchronize: false,
  logging: false,

  entities: [Tenant, Role, User, UserRole, RefreshToken, Permission, Page, PageAccess, RolePageRight],

  migrations: ['src/database/migrations/*{.ts,.js}'],
});

export default AppDataSource;
