import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTenantSchema1784913779527 implements MigrationInterface {
  name = 'UpdateTenantSchema1784913779527';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "contact_email"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "contact_phone"`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "company_email" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "company_phone" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "address_line_1" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "address_line_2" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "city" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "state" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "country" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "postal_code" character varying(20)`);
    await queryRunner.query(`ALTER TYPE "public"."tenant_status_enum" RENAME TO "tenant_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."tenant_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'PENDING')`);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "status" TYPE "public"."tenant_status_enum" USING "status"::"text"::"public"."tenant_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
    await queryRunner.query(`DROP TYPE "public"."tenant_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."tenant_status_enum_old" AS ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE')`);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "status" TYPE "public"."tenant_status_enum_old" USING "status"::"text"::"public"."tenant_status_enum_old"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
    await queryRunner.query(`DROP TYPE "public"."tenant_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."tenant_status_enum_old" RENAME TO "tenant_status_enum"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "postal_code"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "state"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "address_line_2"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "address_line_1"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "company_phone"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "company_email"`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "contact_phone" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "contact_email" character varying(255)`);
  }
}
