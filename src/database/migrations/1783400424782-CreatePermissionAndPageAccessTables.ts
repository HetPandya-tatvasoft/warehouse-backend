import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionAndPageAccessTables1783400424782 implements MigrationInterface {
  name = 'CreatePermissionAndPageAccessTables1783400424782';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(100) NOT NULL, "description" character varying(255), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_permissions_name" ON "permissions"  ("name") `);
    await queryRunner.query(
      `CREATE TABLE "pages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(100) NOT NULL, "description" character varying(255) NOT NULL, CONSTRAINT "PK_8f21ed625aa34c8391d636b7d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_pages_name" ON "pages"  ("name") `);
    await queryRunner.query(
      `CREATE TABLE "page_access" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "page_id" uuid NOT NULL, "access_type_id" uuid NOT NULL, CONSTRAINT "PK_b198fece217b11c2a20dd7e360c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_page_rights" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "role_id" uuid NOT NULL, "page_access_id" uuid NOT NULL, CONSTRAINT "PK_4dc70a8b43bd4a3752b5c4df712" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "page_access" ADD CONSTRAINT "FK_32ddee507dbbdbbbeb0b0234160" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "page_access" ADD CONSTRAINT "FK_2844eb4473b774e4b1321d40675" FOREIGN KEY ("access_type_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_page_rights" ADD CONSTRAINT "FK_83abe765152e163b9ba1819dc88" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_page_rights" ADD CONSTRAINT "FK_9d3e0b81146d140495e2468e6fe" FOREIGN KEY ("page_access_id") REFERENCES "page_access"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "role_page_rights" DROP CONSTRAINT "FK_9d3e0b81146d140495e2468e6fe"`);
    await queryRunner.query(`ALTER TABLE "role_page_rights" DROP CONSTRAINT "FK_83abe765152e163b9ba1819dc88"`);
    await queryRunner.query(`ALTER TABLE "page_access" DROP CONSTRAINT "FK_2844eb4473b774e4b1321d40675"`);
    await queryRunner.query(`ALTER TABLE "page_access" DROP CONSTRAINT "FK_32ddee507dbbdbbbeb0b0234160"`);
    await queryRunner.query(`DROP TABLE "role_page_rights"`);
    await queryRunner.query(`DROP TABLE "page_access"`);
    await queryRunner.query(`DROP INDEX "public"."uq_pages_name"`);
    await queryRunner.query(`DROP TABLE "pages"`);
    await queryRunner.query(`DROP INDEX "public"."uq_permissions_name"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
