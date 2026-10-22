import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductCategoryAttributes1791417700000 implements MigrationInterface {
  name = 'CreateProductCategoryAttributes1791417700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_category_attributes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "attribute_id" uuid NOT NULL,
        CONSTRAINT "pk_product_category_attributes" PRIMARY KEY ("id"),
        CONSTRAINT "uq_product_category_attributes_tenant_cat_attr" UNIQUE ("tenant_id", "category_id", "attribute_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_product_category_attributes_tenant_category"
      ON "product_category_attributes" ("tenant_id", "category_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_product_category_attributes_tenant_attribute"
      ON "product_category_attributes" ("tenant_id", "attribute_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "product_category_attributes"
      ADD CONSTRAINT "fk_product_category_attributes_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "product_category_attributes"
      ADD CONSTRAINT "fk_product_category_attributes_category"
      FOREIGN KEY ("category_id") REFERENCES "product_categories"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "product_category_attributes"
      ADD CONSTRAINT "fk_product_category_attributes_attribute"
      FOREIGN KEY ("attribute_id") REFERENCES "product_attributes"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_category_attributes"
      DROP CONSTRAINT "fk_product_category_attributes_attribute"
    `);

    await queryRunner.query(`
      ALTER TABLE "product_category_attributes"
      DROP CONSTRAINT "fk_product_category_attributes_category"
    `);

    await queryRunner.query(`
      ALTER TABLE "product_category_attributes"
      DROP CONSTRAINT "fk_product_category_attributes_tenant"
    `);

    await queryRunner.query(`DROP INDEX "public"."idx_product_category_attributes_tenant_attribute"`);
    await queryRunner.query(`DROP INDEX "public"."idx_product_category_attributes_tenant_category"`);
    await queryRunner.query(`DROP TABLE "product_category_attributes"`);
  }
}
