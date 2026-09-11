import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBranchesAndUserBranches1785393429676 implements MigrationInterface {
  name = 'CreateBranchesAndUserBranches1785393429676';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."branch_status" AS ENUM('ACTIVE', 'INACTIVE')`);
    await queryRunner.query(
      `CREATE TABLE "tenant_branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "status" "public"."branch_status" NOT NULL DEFAULT 'ACTIVE', "address_line_1" character varying(255), "address_line_2" character varying(255), "city" character varying(100), "state" character varying(100), "country" character varying(100), "postal_code" character varying(20), "is_deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f17c6c3416e4433162c116ec01a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_tenant_branches_tenant_id" ON "tenant_branches"  ("tenant_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_tenant_branches_tenant_name" ON "tenant_branches"  ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "assigned_by" uuid, CONSTRAINT "PK_45063e37edfcad5acaa0158c53a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_user_branches_branch_id" ON "user_branches"  ("branch_id") `);
    await queryRunner.query(`CREATE INDEX "idx_user_branches_user_id" ON "user_branches"  ("user_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_primary_branch" ON "user_branches"  ("user_id") WHERE is_primary = TRUE`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_user_branch" ON "user_branches"  ("user_id", "branch_id") `);
    await queryRunner.query(
      `ALTER TABLE "tenant_branches" ADD CONSTRAINT "FK_aef1d11ff35bd5e8c721f715e0d" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" ADD CONSTRAINT "FK_a93a8dec13e6204974dd67386ed" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" ADD CONSTRAINT "FK_7252d91dd610730c97d6b58ae79" FOREIGN KEY ("branch_id") REFERENCES "tenant_branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" ADD CONSTRAINT "FK_5ea4834bd129cfee1a9a98d261c" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_branches" DROP CONSTRAINT "FK_5ea4834bd129cfee1a9a98d261c"`);
    await queryRunner.query(`ALTER TABLE "user_branches" DROP CONSTRAINT "FK_7252d91dd610730c97d6b58ae79"`);
    await queryRunner.query(`ALTER TABLE "user_branches" DROP CONSTRAINT "FK_a93a8dec13e6204974dd67386ed"`);
    await queryRunner.query(`ALTER TABLE "tenant_branches" DROP CONSTRAINT "FK_aef1d11ff35bd5e8c721f715e0d"`);
    await queryRunner.query(`DROP INDEX "public"."uq_user_branch"`);
    await queryRunner.query(`DROP INDEX "public"."uq_user_primary_branch"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_branches_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_branches_branch_id"`);
    await queryRunner.query(`DROP TABLE "user_branches"`);
    await queryRunner.query(`DROP INDEX "public"."uq_tenant_branches_tenant_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tenant_branches_tenant_id"`);
    await queryRunner.query(`DROP TABLE "tenant_branches"`);
    await queryRunner.query(`DROP TYPE "public"."branch_status"`);
  }
}
