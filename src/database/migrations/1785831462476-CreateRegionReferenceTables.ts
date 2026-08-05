import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegionReferenceTables1785831462476 implements MigrationInterface {
  name = 'CreateRegionReferenceTables1785831462476';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cities" ("id" bigint NOT NULL, "name" character varying(150) NOT NULL, "stateId" bigint NOT NULL, CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a4cb6707b4d50e5ab5401873da" ON "cities"  ("stateId", "name") `);
    await queryRunner.query(
      `CREATE TABLE "states" ("id" bigint NOT NULL, "name" character varying(150) NOT NULL, "code" character varying(10) NOT NULL, "countryId" bigint NOT NULL, CONSTRAINT "PK_09ab30ca0975c02656483265f4f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4dfd595a8ce7883575e54af471" ON "states"  ("countryId", "code") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1e0f02ae40fe2ea4da13b8d460" ON "states"  ("countryId", "name") `);
    await queryRunner.query(
      `CREATE TABLE "countries" ("id" bigint NOT NULL, "name" character varying(150) NOT NULL, "code" character varying(10) NOT NULL, CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b47cbb5311bad9c9ae17b8c1ed" ON "countries"  ("code") `);
    await queryRunner.query(
      `ALTER TABLE "cities" ADD CONSTRAINT "FK_ded8a17cd090922d5bac8a2361f" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "states" ADD CONSTRAINT "FK_76ac7edf8f44e80dff569db7321" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "states" DROP CONSTRAINT "FK_76ac7edf8f44e80dff569db7321"`);
    await queryRunner.query(`ALTER TABLE "cities" DROP CONSTRAINT "FK_ded8a17cd090922d5bac8a2361f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b47cbb5311bad9c9ae17b8c1ed"`);
    await queryRunner.query(`DROP TABLE "countries"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1e0f02ae40fe2ea4da13b8d460"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4dfd595a8ce7883575e54af471"`);
    await queryRunner.query(`DROP TABLE "states"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4cb6707b4d50e5ab5401873da"`);
    await queryRunner.query(`DROP TABLE "cities"`);
  }
}
