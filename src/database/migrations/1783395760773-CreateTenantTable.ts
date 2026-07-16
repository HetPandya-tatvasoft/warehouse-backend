import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantTable1783395760773 implements MigrationInterface {
  name = 'CreateTenantTable1783395760773';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."tenant_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE')`);
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(150) NOT NULL, "slug" character varying(100) NOT NULL, "status" "public"."tenant_status_enum" NOT NULL DEFAULT 'ACTIVE', "contact_email" character varying(255), "contact_phone" character varying(20), CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_tenants_slug" ON "tenants"  ("slug") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_tenants_slug"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_status_enum"`);
  }
}
