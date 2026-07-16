import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRedundantUnique1783396229178 implements MigrationInterface {
  name = 'UpdateRedundantUnique1783396229178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug")`);
  }
}
