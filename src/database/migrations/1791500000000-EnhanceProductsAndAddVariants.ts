import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceProductsAndAddVariants1791500000000 implements MigrationInterface {
  name = 'EnhanceProductsAndAddVariants1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Alter products table to add new required and optional product management columns
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "code" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" uuid`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand_id" uuid`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "base_uom_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_purchasable" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_sellable" boolean NOT NULL DEFAULT true`,
    );

    // Make legacy price and sku nullable to support pure physical catalog products without pricing
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "sku" DROP NOT NULL`);

    // Backfill any legacy product rows if present
    await queryRunner.query(
      `UPDATE "products" SET "code" = CONCAT('PRD-', SUBSTRING("id"::text, 1, 8)) WHERE "code" IS NULL`,
    );

    // Constraints on products
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_products_tenant_code" ON "products" ("tenant_id", "code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_tenant_category" ON "products" ("tenant_id", "category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_tenant_brand" ON "products" ("tenant_id", "brand_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_tenant_status" ON "products" ("tenant_id", "status")`,
    );

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_category"
      FOREIGN KEY ("category_id") REFERENCES "product_categories"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_brand"
      FOREIGN KEY ("brand_id") REFERENCES "product_brands"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_base_uom"
      FOREIGN KEY ("base_uom_id") REFERENCES "units_of_measure"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // 2. Table: product_attribute_configs
    await queryRunner.query(`
      CREATE TABLE "product_attribute_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "attribute_id" uuid NOT NULL,
        "type" character varying(20) NOT NULL DEFAULT 'STATIC',
        "order_index" integer NOT NULL DEFAULT 0,
        "static_value_id" uuid,
        CONSTRAINT "PK_product_attribute_configs" PRIMARY KEY ("id"),
        CONSTRAINT "uq_product_attribute_configs_product_attr" UNIQUE ("product_id", "attribute_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product_attribute_configs"
      ADD CONSTRAINT "FK_prod_attr_cfg_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_attribute_configs"
      ADD CONSTRAINT "FK_prod_attr_cfg_product"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_attribute_configs"
      ADD CONSTRAINT "FK_prod_attr_cfg_attribute"
      FOREIGN KEY ("attribute_id") REFERENCES "product_attributes"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_attribute_configs"
      ADD CONSTRAINT "FK_prod_attr_cfg_static_val"
      FOREIGN KEY ("static_value_id") REFERENCES "product_attribute_values"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_prod_attr_cfg_tenant_prod" ON "product_attribute_configs" ("tenant_id", "product_id")
    `);

    // 3. Table: product_dynamic_attribute_value_configs
    await queryRunner.query(`
      CREATE TABLE "product_dynamic_attribute_value_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "attribute_config_id" uuid NOT NULL,
        "attribute_value_id" uuid NOT NULL,
        "code" character varying(20) NOT NULL,
        CONSTRAINT "PK_prod_dyn_attr_val_configs" PRIMARY KEY ("id"),
        CONSTRAINT "uq_prod_dyn_attr_val_cfg_attr_val" UNIQUE ("attribute_config_id", "attribute_value_id"),
        CONSTRAINT "uq_prod_dyn_attr_val_cfg_attr_code" UNIQUE ("attribute_config_id", "code")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product_dynamic_attribute_value_configs"
      ADD CONSTRAINT "FK_prod_dyn_val_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_dynamic_attribute_value_configs"
      ADD CONSTRAINT "FK_prod_dyn_val_product"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_dynamic_attribute_value_configs"
      ADD CONSTRAINT "FK_prod_dyn_val_config"
      FOREIGN KEY ("attribute_config_id") REFERENCES "product_attribute_configs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_dynamic_attribute_value_configs"
      ADD CONSTRAINT "FK_prod_dyn_val_attr_val"
      FOREIGN KEY ("attribute_value_id") REFERENCES "product_attribute_values"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_prod_dyn_val_tenant_prod" ON "product_dynamic_attribute_value_configs" ("tenant_id", "product_id")
    `);

    // 4. Table: product_variants
    await queryRunner.query(`
      CREATE TABLE "product_variants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "sku" character varying(100) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
        "is_default" boolean NOT NULL DEFAULT false,
        "combination_hash" character varying(255) NOT NULL DEFAULT '',
        CONSTRAINT "PK_product_variants" PRIMARY KEY ("id"),
        CONSTRAINT "uq_product_variants_tenant_sku" UNIQUE ("tenant_id", "sku"),
        CONSTRAINT "uq_product_variants_product_combination" UNIQUE ("product_id", "combination_hash")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD CONSTRAINT "FK_product_variants_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variants"
      ADD CONSTRAINT "FK_product_variants_product"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_product_variants_tenant_prod" ON "product_variants" ("tenant_id", "product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_product_variants_tenant_status" ON "product_variants" ("tenant_id", "status")
    `);

    // 5. Table: product_variant_attribute_values
    await queryRunner.query(`
      CREATE TABLE "product_variant_attribute_values" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "variant_id" uuid NOT NULL,
        "attribute_id" uuid NOT NULL,
        "attribute_value_id" uuid NOT NULL,
        CONSTRAINT "PK_product_variant_attribute_values" PRIMARY KEY ("id"),
        CONSTRAINT "uq_product_variant_attr_vals_variant_attr" UNIQUE ("variant_id", "attribute_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "product_variant_attribute_values"
      ADD CONSTRAINT "FK_prod_var_val_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variant_attribute_values"
      ADD CONSTRAINT "FK_prod_var_val_variant"
      FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variant_attribute_values"
      ADD CONSTRAINT "FK_prod_var_val_attribute"
      FOREIGN KEY ("attribute_id") REFERENCES "product_attributes"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product_variant_attribute_values"
      ADD CONSTRAINT "FK_prod_var_val_attr_val"
      FOREIGN KEY ("attribute_value_id") REFERENCES "product_attribute_values"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_prod_var_val_tenant_var" ON "product_variant_attribute_values" ("tenant_id", "variant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variant_attribute_values"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_dynamic_attribute_value_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_attribute_configs"`);

    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_base_uom"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_brand"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_category"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_products_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_products_tenant_brand"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_products_tenant_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."uq_products_tenant_code"`);

    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "is_sellable"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "is_purchasable"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "base_uom_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "brand_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "category_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "code"`);
  }
}
