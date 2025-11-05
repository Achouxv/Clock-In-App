import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { JobSite } from './job-site.entity';
import { User } from './user.entity';

export enum RawClockType {
  IN = 'in',
  OUT = 'out',
  PAUSE_START = 'pause_start',
  PAUSE_END = 'pause_end'
}

@Entity({ name: 'raw_clocks' })
@Index('idx_raw_clocks_user_timestamp', ['userId', 'timestamp'])
export class RawClock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'text' })
  source!: string;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'enum', enum: RawClockType, name: 'type' })
  type!: RawClockType;

  @Column({ type: 'uuid', nullable: true, name: 'job_site_id' })
  jobSiteId!: string | null;

  @ManyToOne(() => JobSite, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'job_site_id' })
  jobSite!: JobSite | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  meta!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
