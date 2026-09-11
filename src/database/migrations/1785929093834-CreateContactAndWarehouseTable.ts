import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactAndWarehouseTable1785929093834 implements MigrationInterface {
  name = 'CreateContactAndWarehouseTable1785929093834';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, "full_name" character varying(150) NOT NULL, "email" character varying(255), "phone" character varying(20) NOT NULL, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "warehouse_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "warehouse_id" uuid NOT NULL, "contact_id" uuid NOT NULL, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_50a5080b92def38b0a3c56e788e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_warehouse_contacts_warehouse_default" ON "warehouse_contacts"  ("warehouse_id") WHERE is_default = true`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_warehouse_contacts_warehouse_contact" ON "warehouse_contacts"  ("warehouse_id", "contact_id") `,
    );
    await queryRunner.query(`CREATE TYPE "public"."warehouse_status" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(
      `CREATE TABLE "warehouses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "branch_id" uuid NOT NULL, "address_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "code" character varying(50) NOT NULL, "status" "public"."warehouse_status" NOT NULL DEFAULT 'ACTIVE', "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_c1f558ffa8a9690d17415d0652" UNIQUE ("address_id"), CONSTRAINT "PK_56ae21ee2432b2270b48867e4be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_warehouses_branch_id_code" ON "warehouses"  ("branch_id", "code") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_warehouses_branch_id_name" ON "warehouses"  ("branch_id", "name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_af0a71ac1879b584f255c49c99a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "warehouse_contacts" ADD CONSTRAINT "FK_1ca593b2400dbe5c0d5465ffab2" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "warehouse_contacts" ADD CONSTRAINT "FK_a3d8dc45745a3db6c01ddc5c64f" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "warehouses" ADD CONSTRAINT "FK_d1a87bf9de7503bb1b6fc0cb859" FOREIGN KEY ("branch_id") REFERENCES "tenant_branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "warehouses" ADD CONSTRAINT "FK_c1f558ffa8a9690d17415d06521" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "warehouses" DROP CONSTRAINT "FK_c1f558ffa8a9690d17415d06521"`);
    await queryRunner.query(`ALTER TABLE "warehouses" DROP CONSTRAINT "FK_d1a87bf9de7503bb1b6fc0cb859"`);
    await queryRunner.query(`ALTER TABLE "warehouse_contacts" DROP CONSTRAINT "FK_a3d8dc45745a3db6c01ddc5c64f"`);
    await queryRunner.query(`ALTER TABLE "warehouse_contacts" DROP CONSTRAINT "FK_1ca593b2400dbe5c0d5465ffab2"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_af0a71ac1879b584f255c49c99a"`);
    await queryRunner.query(`DROP INDEX "public"."uq_warehouses_branch_id_name"`);
    await queryRunner.query(`DROP INDEX "public"."uq_warehouses_branch_id_code"`);
    await queryRunner.query(`DROP TABLE "warehouses"`);
    await queryRunner.query(`DROP TYPE "public"."warehouse_status"`);
    await queryRunner.query(`DROP INDEX "public"."uq_warehouse_contacts_warehouse_contact"`);
    await queryRunner.query(`DROP INDEX "public"."uq_warehouse_contacts_warehouse_default"`);
    await queryRunner.query(`DROP TABLE "warehouse_contacts"`);
    await queryRunner.query(`DROP TABLE "contacts"`);
  }
}
