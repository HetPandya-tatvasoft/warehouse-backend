import type { MigrationInterface, QueryRunner } from 'typeorm';

const ECMASCRIPT_TRIM_CHARACTERS =
  "U&'\\0009\\000A\\000B\\000C\\000D\\0020\\00A0\\1680\\2000\\2001\\2002\\2003\\2004\\2005\\2006\\2007\\2008\\2009\\200A\\2028\\2029\\202F\\205F\\3000\\FEFF'";

export class CreateProductAttributes1791417600000 implements MigrationInterface {
  name = 'CreateProductAttributes1791417600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."product_attribute_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(`
      CREATE TABLE "product_attributes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) COLLATE "C" NOT NULL,
        "status" "public"."product_attribute_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "pk_product_attributes" PRIMARY KEY ("id"),
        CONSTRAINT "ck_product_attributes_name_length" CHECK (char_length("name") BETWEEN 1 AND 150),
        CONSTRAINT "ck_product_attributes_name_trim" CHECK ("name" = btrim("name", ${ECMASCRIPT_TRIM_CHARACTERS}))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "product_attribute_values" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "attribute_id" uuid NOT NULL,
        "label" character varying(150) COLLATE "C" NOT NULL,
        "status" "public"."product_attribute_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "pk_product_attribute_values" PRIMARY KEY ("id"),
        CONSTRAINT "ck_product_attribute_values_label_length" CHECK (char_length("label") BETWEEN 1 AND 150),
        CONSTRAINT "ck_product_attribute_values_label_trim" CHECK ("label" = btrim("label", ${ECMASCRIPT_TRIM_CHARACTERS}))
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product_attributes"
      ADD CONSTRAINT "fk_product_attributes_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_attribute_values"
      ADD CONSTRAINT "fk_product_attribute_values_attribute"
      FOREIGN KEY ("attribute_id") REFERENCES "product_attributes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_product_attributes_tenant_name_ci"
      ON "product_attributes" ("tenant_id", (lower("name" COLLATE pg_catalog."und-x-icu") COLLATE "C"))
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_product_attribute_values_attribute_label_ci"
      ON "product_attribute_values" ("attribute_id", (lower("label" COLLATE pg_catalog."und-x-icu") COLLATE "C"))
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_product_attributes_tenant_created"
      ON "product_attributes" ("tenant_id", "created_at" DESC, "id" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_product_attributes_tenant_status_created"
      ON "product_attributes" ("tenant_id", "status", "created_at" DESC, "id" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_product_attribute_values_attribute_created"
      ON "product_attribute_values" ("attribute_id", "created_at" DESC, "id" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_product_attribute_values_attribute_status_created"
      ON "product_attribute_values" ("attribute_id", "status", "created_at" DESC, "id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_attribute_values"`);
    await queryRunner.query(`DROP TABLE "product_attributes"`);
    await queryRunner.query(`DROP TYPE "public"."product_attribute_status_enum"`);
  }
}
