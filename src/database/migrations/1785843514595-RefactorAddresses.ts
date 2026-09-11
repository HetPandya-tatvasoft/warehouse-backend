import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAddresses1785843514595 implements MigrationInterface {
  name = 'RefactorAddresses1785843514595';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the addresses table (initially allowing NULL values to copy data safely)
    await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
        "address_line_1" character varying(255), 
        "address_line_2" character varying(255), 
        "country_id" bigint, 
        "state_id" bigint, 
        "city_id" bigint, 
        "postal_code" character varying(20), 
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id_temp" uuid,
        "tenant_branch_id_temp" uuid,
        CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id")
      )
    `);

    // 2. Add address_id columns to tenants and tenant_branches as nullable initially
    await queryRunner.query(`ALTER TABLE "tenants" ADD "address_id" uuid`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" ADD "address_id" uuid`);

    // 3. Migrate data from tenants to addresses
    // We map string name columns to ID columns in the countries, states, cities reference tables
    await queryRunner.query(`
      INSERT INTO "addresses" ("address_line_1", "address_line_2", "postal_code", "country_id", "state_id", "city_id", "tenant_id_temp", "created_at", "updated_at")
      SELECT 
          t."address_line_1", 
          t."address_line_2", 
          t."postal_code", 
          c."id" AS "country_id", 
          s."id" AS "state_id", 
          ci."id" AS "city_id",
          t."id" AS "tenant_id_temp",
          t."created_at",
          t."updated_at"
      FROM "tenants" t
      LEFT JOIN "countries" c ON LOWER(TRIM(t."country")) = LOWER(TRIM(c."name")) OR LOWER(TRIM(t."country")) = LOWER(TRIM(c."code"))
      LEFT JOIN "states" s ON LOWER(TRIM(t."state")) = LOWER(TRIM(s."name")) AND s."countryId" = c."id"
      LEFT JOIN "cities" ci ON LOWER(TRIM(t."city")) = LOWER(TRIM(ci."name")) AND ci."stateId" = s."id"
      WHERE t."address_line_1" IS NOT NULL OR t."address_line_2" IS NOT NULL OR t."city" IS NOT NULL OR t."state" IS NOT NULL OR t."country" IS NOT NULL OR t."postal_code" IS NOT NULL
    `);

    // 4. Update tenants with the new address_id reference
    await queryRunner.query(`
      UPDATE "tenants" t
      SET "address_id" = a."id"
      FROM "addresses" a
      WHERE a."tenant_id_temp" = t."id"
    `);

    // 5. Migrate data from tenant_branches to addresses
    await queryRunner.query(`
      INSERT INTO "addresses" ("address_line_1", "address_line_2", "postal_code", "country_id", "state_id", "city_id", "tenant_branch_id_temp", "created_at", "updated_at")
      SELECT 
          tb."address_line_1", 
          tb."address_line_2", 
          tb."postal_code", 
          c."id" AS "country_id", 
          s."id" AS "state_id", 
          ci."id" AS "city_id",
          tb."id" AS "tenant_branch_id_temp",
          tb."created_at",
          tb."updated_at"
      FROM "tenant_branches" tb
      LEFT JOIN "countries" c ON LOWER(TRIM(tb."country")) = LOWER(TRIM(c."name")) OR LOWER(TRIM(tb."country")) = LOWER(TRIM(c."code"))
      LEFT JOIN "states" s ON LOWER(TRIM(tb."state")) = LOWER(TRIM(s."name")) AND s."countryId" = c."id"
      LEFT JOIN "cities" ci ON LOWER(TRIM(tb."city")) = LOWER(TRIM(ci."name")) AND ci."stateId" = s."id"
      WHERE tb."address_line_1" IS NOT NULL OR tb."address_line_2" IS NOT NULL OR tb."city" IS NOT NULL OR tb."state" IS NOT NULL OR tb."country" IS NOT NULL OR tb."postal_code" IS NOT NULL
    `);

    // 6. Update tenant_branches with the new address_id reference
    await queryRunner.query(`
      UPDATE "tenant_branches" tb
      SET "address_id" = a."id"
      FROM "addresses" a
      WHERE a."tenant_branch_id_temp" = tb."id"
    `);

    // 7. Drop temporary columns
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "tenant_id_temp"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "tenant_branch_id_temp"`);

    // 8. Drop old address columns from tenants and tenant_branches
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "address_line_1"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "address_line_2"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "state"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "postal_code"`);

    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP COLUMN "address_line_1"`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP COLUMN "address_line_2"`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP COLUMN "state"`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP COLUMN "postal_code"`);

    // 9. Enforce NOT NULL constraints on newly populated reference and business columns
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "address_line_1" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "country_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "state_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "city_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "postal_code" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "address_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" ALTER COLUMN "address_id" SET NOT NULL`);

    // 10. Add unique constraint and foreign keys
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "UQ_4dbfecae1a572949c5d6f2e92b6" UNIQUE ("address_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_branches" ADD CONSTRAINT "UQ_885214f52e71c4bbe763ea03e2a" UNIQUE ("address_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_98e1ca336038167c7eb48c02582" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_7a09eedbe103fab90c2890e525e" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_baebeb388634106e4cbb46192b9" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "FK_4dbfecae1a572949c5d6f2e92b6" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_branches" ADD CONSTRAINT "FK_885214f52e71c4bbe763ea03e2a" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop constraints
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP CONSTRAINT "FK_885214f52e71c4bbe763ea03e2a"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "FK_4dbfecae1a572949c5d6f2e92b6"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_baebeb388634106e4cbb46192b9"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_7a09eedbe103fab90c2890e525e"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_98e1ca336038167c7eb48c02582"`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP CONSTRAINT "UQ_885214f52e71c4bbe763ea03e2a"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "UQ_4dbfecae1a572949c5d6f2e92b6"`);

    // 2. Remove NOT NULL constraints on parents to copy nullable addresses back
    await queryRunner.query(`ALTER TABLE "tenant_branches" ALTER COLUMN "address_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "address_id" DROP NOT NULL`);

    // 3. Add original columns back
    await queryRunner.query(`ALTER TABLE "tenant_branches" ADD "country" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" ADD "postal_code" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" ADD "address_line_1" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" ADD "address_line_2" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" ADD "city" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" ADD "state" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "address_line_1" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "address_line_2" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "city" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "state" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "country" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "postal_code" character varying(20)`);

    // 4. Copy address data back from addresses and reference tables
    await queryRunner.query(`
      UPDATE "tenants" t
      SET 
          "address_line_1" = a."address_line_1",
          "address_line_2" = a."address_line_2",
          "postal_code" = a."postal_code",
          "country" = c."name",
          "state" = s."name",
          "city" = ci."name"
      FROM "addresses" a
      LEFT JOIN "countries" c ON a."country_id" = c."id"
      LEFT JOIN "states" s ON a."state_id" = s."id"
      LEFT JOIN "cities" ci ON a."city_id" = ci."id"
      WHERE t."address_id" = a."id"
    `);

    await queryRunner.query(`
      UPDATE "tenant_branches" tb
      SET 
          "address_line_1" = a."address_line_1",
          "address_line_2" = a."address_line_2",
          "postal_code" = a."postal_code",
          "country" = c."name",
          "state" = s."name",
          "city" = ci."name"
      FROM "addresses" a
      LEFT JOIN "countries" c ON a."country_id" = c."id"
      LEFT JOIN "states" s ON a."state_id" = s."id"
      LEFT JOIN "cities" ci ON a."city_id" = ci."id"
      WHERE tb."address_id" = a."id"
    `);

    // 5. Drop address_id columns and addresses table
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP COLUMN "address_id"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "address_id"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
  }
}
