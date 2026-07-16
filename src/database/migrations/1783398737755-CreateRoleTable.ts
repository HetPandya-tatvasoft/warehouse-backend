import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoleTable1783398737755 implements MigrationInterface {
  name = 'CreateRoleTable1783398737755';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_e59a01f4fe46ebbece575d9a0fc"`);
    await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "tenant_id" DROP NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_roles_tenant_name" ON "roles"  ("tenant_id", "name") `);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_e59a01f4fe46ebbece575d9a0fc" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_e59a01f4fe46ebbece575d9a0fc"`);
    await queryRunner.query(`DROP INDEX "public"."uq_roles_tenant_name"`);
    await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "tenant_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_e59a01f4fe46ebbece575d9a0fc" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
