import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1786689041665 implements MigrationInterface {
  name = 'CreateProductsTable1786689041665';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."product_status" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "sku" character varying(100) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "status" "public"."product_status" NOT NULL DEFAULT 'ACTIVE', "is_deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_products_tenant_sku" ON "products"  ("tenant_id", "sku") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9c365ebf78f0e8a6d9e4827ea70" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9c365ebf78f0e8a6d9e4827ea70"`);
    await queryRunner.query(`DROP INDEX "public"."uq_products_tenant_sku"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."product_status"`);
  }
}
