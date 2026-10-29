import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductUnitsOfMeasure1791417900000 implements MigrationInterface {
  name = 'CreateProductUnitsOfMeasure1791417900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."unit_of_measure_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(`
      CREATE TABLE "units_of_measure" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "code" character varying(20) NOT NULL,
        "allows_fractional_quantity" boolean NOT NULL,
        "status" "public"."unit_of_measure_status_enum" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "PK_units_of_measure" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "units_of_measure"
      ADD CONSTRAINT "FK_units_of_measure_tenant"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_units_of_measure_tenant_name"
      ON "units_of_measure" ("tenant_id", LOWER("name"))
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_units_of_measure_tenant_code"
      ON "units_of_measure" ("tenant_id", LOWER("code"))
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_units_of_measure_tenant_created"
      ON "units_of_measure" ("tenant_id", "created_at" DESC, "id" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_units_of_measure_tenant_status_created"
      ON "units_of_measure" ("tenant_id", "status", "created_at" DESC, "id" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_units_of_measure_tenant_name"
      ON "units_of_measure" ("tenant_id", "name" ASC, "id" ASC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_units_of_measure_tenant_code"
      ON "units_of_measure" ("tenant_id", "code" ASC, "id" ASC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_units_of_measure_tenant_code"`);
    await queryRunner.query(`DROP INDEX "public"."idx_units_of_measure_tenant_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_units_of_measure_tenant_status_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_units_of_measure_tenant_created"`);
    await queryRunner.query(`DROP INDEX "public"."uq_units_of_measure_tenant_code"`);
    await queryRunner.query(`DROP INDEX "public"."uq_units_of_measure_tenant_name"`);
    await queryRunner.query(`ALTER TABLE "units_of_measure" DROP CONSTRAINT "FK_units_of_measure_tenant"`);
    await queryRunner.query(`DROP TABLE "units_of_measure"`);
    await queryRunner.query(`DROP TYPE "public"."unit_of_measure_status_enum"`);
  }
}
