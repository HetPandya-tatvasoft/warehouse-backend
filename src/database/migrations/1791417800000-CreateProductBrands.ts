import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductBrands1791417800000 implements MigrationInterface {
  name = 'CreateProductBrands1791417800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."product_brand_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(`
      CREATE TABLE "product_brands" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "status" "public"."product_brand_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "PK_product_brands" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product_brands"
      ADD CONSTRAINT "FK_product_brands_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_product_brands_tenant_name"
      ON "product_brands" ("tenant_id", LOWER("name"))
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_product_brands_tenant_created"
      ON "product_brands" ("tenant_id", "created_at" DESC, "id" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_product_brands_tenant_status_created"
      ON "product_brands" ("tenant_id", "status", "created_at" DESC, "id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_product_brands_tenant_status_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_product_brands_tenant_created"`);
    await queryRunner.query(`DROP INDEX "public"."uq_product_brands_tenant_name"`);
    await queryRunner.query(`ALTER TABLE "product_brands" DROP CONSTRAINT "FK_product_brands_tenant"`);
    await queryRunner.query(`DROP TABLE "product_brands"`);
    await queryRunner.query(`DROP TYPE "public"."product_brand_status_enum"`);
  }
}
