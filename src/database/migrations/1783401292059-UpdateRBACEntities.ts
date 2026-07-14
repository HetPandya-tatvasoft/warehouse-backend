import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRBACEntities1783401292059 implements MigrationInterface {
  name = 'UpdateRBACEntities1783401292059';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pages" ALTER COLUMN "description" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_page_access_page_permission" ON "page_access"  ("page_id", "access_type_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_role_page_rights_role_access" ON "role_page_rights"  ("role_id", "page_access_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_role_page_rights_role_access"`);
    await queryRunner.query(`DROP INDEX "public"."uq_page_access_page_permission"`);
    await queryRunner.query(`ALTER TABLE "pages" ALTER COLUMN "description" SET NOT NULL`);
  }
}
