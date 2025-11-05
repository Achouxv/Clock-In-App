import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { JobSite } from './entities/job-site.entity';
import { MonthlySnapshot } from './entities/monthly-snapshot.entity';
import { RawClock } from './entities/raw-clock.entity';
import { Shift } from './entities/shift.entity';
import { ShiftAudit } from './entities/shift-audit.entity';
import { TravelSegment } from './entities/travel-segment.entity';
import { User } from './entities/user.entity';

const envFiles = [process.env.ENV_FILE, '../../.env', '.env'].filter((value): value is string => Boolean(value));
for (const file of envFiles) {
  loadEnv({ path: file, override: false });
}

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'worktime',
  password: process.env.DB_PASSWORD ?? 'worktime',
  database: process.env.DB_NAME ?? 'worktime',
    entities: [User, JobSite, RawClock, Shift, TravelSegment, MonthlySnapshot, ShiftAudit],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  migrationsTableName: 'migrations'
};

export const AppDataSource = new DataSource(options);

export default options;
