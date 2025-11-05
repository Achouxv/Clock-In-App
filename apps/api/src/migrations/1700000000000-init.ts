import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1700000000000 implements MigrationInterface {
  name = 'Init1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`CREATE TYPE "raw_clocks_type_enum" AS ENUM ('in', 'out', 'pause_start', 'pause_end')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "timezone" varchar(64) NOT NULL DEFAULT 'Europe/Rome',
        "hourly_rate" numeric(10,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email")');

    await queryRunner.query(`
      CREATE TABLE "job_sites" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "address" varchar(255) NOT NULL,
        "city" varchar(120) NOT NULL,
        "province" varchar(120) NOT NULL,
        "region" varchar(120) NOT NULL,
        "country" varchar(120) NOT NULL,
        "lat" double precision,
        "lon" double precision,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "idx_job_sites_region_country" ON "job_sites" ("region", "country")');

    await queryRunner.query(`
      CREATE TABLE "raw_clocks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "source" text NOT NULL,
        "timestamp" timestamptz NOT NULL,
        "type" "raw_clocks_type_enum" NOT NULL,
        "job_site_id" uuid,
        "meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_raw_clocks_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_raw_clocks_job_site" FOREIGN KEY ("job_site_id") REFERENCES "job_sites"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query('CREATE INDEX "idx_raw_clocks_user_timestamp" ON "raw_clocks" ("user_id", "timestamp")');

    await queryRunner.query(`
      CREATE TABLE "shifts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "job_site_id" uuid NOT NULL,
        "start" timestamptz NOT NULL,
        "end" timestamptz NOT NULL,
        "duration_minutes" integer NOT NULL,
        "is_trasferta" boolean NOT NULL DEFAULT false,
        "travel_hours" numeric(6,2) NOT NULL DEFAULT 0,
        "allowances" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "source_event_ids" uuid[] NOT NULL DEFAULT '{}'::uuid[],
        "is_incomplete" boolean NOT NULL DEFAULT false,
        "anomalies" text[] NOT NULL DEFAULT '{}'::text[],
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_shifts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_shifts_job_site" FOREIGN KEY ("job_site_id") REFERENCES "job_sites"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_shifts_month" ON "shifts" (date_trunc('month', "start"))`);

    await queryRunner.query(`
      CREATE TABLE "shift_audits" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "shift_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "changes" jsonb NOT NULL,
        "reason" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_shift_audits_shift" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_shift_audits_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "travel_segments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "date" date NOT NULL,
        "km" integer NOT NULL,
        "computed_travel_hours" numeric(6,2) NOT NULL,
        "source" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_travel_segments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "monthly_snapshots" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "total_minutes" integer NOT NULL DEFAULT 0,
        "avg_minutes_per_day" numeric(6,2) NOT NULL DEFAULT 0,
        "days_trasferta" integer NOT NULL DEFAULT 0,
        "days_not_trasferta" integer NOT NULL DEFAULT 0,
        "buoni_count" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "computed_salary" numeric(12,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_monthly_snapshots_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "monthly_snapshots"');
    await queryRunner.query('DROP TABLE "shift_audits"');
    await queryRunner.query('DROP TABLE "travel_segments"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_shifts_month"');
    await queryRunner.query('DROP TABLE "shifts"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_raw_clocks_user_timestamp"');
    await queryRunner.query('DROP TABLE "raw_clocks"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_job_sites_region_country"');
    await queryRunner.query('DROP TABLE "job_sites"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_users_email"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TYPE "raw_clocks_type_enum"');
  }
}
