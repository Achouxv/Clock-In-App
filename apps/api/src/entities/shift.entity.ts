import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { JobSite } from './job-site.entity';
import { User } from './user.entity';

@Entity({ name: 'shifts' })
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'job_site_id' })
  jobSiteId!: string;

  @ManyToOne(() => JobSite, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_site_id' })
  jobSite!: JobSite;

  @Column({ type: 'timestamptz', name: 'start' })
  start!: Date;

  @Column({ type: 'timestamptz', name: 'end' })
  end!: Date;

  @Column({ type: 'int', name: 'duration_minutes' })
  durationMinutes!: number;

  @Column({ type: 'boolean', default: false, name: 'is_trasferta' })
  isTrasferta!: boolean;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0, name: 'travel_hours' })
  travelHours!: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb", name: 'allowances' })
  allowances!: Record<string, unknown>;

  @Column({ type: 'uuid', array: true, default: () => "'{}'::uuid[]", name: 'source_event_ids' })
  sourceEventIds!: string[];

  @Column({ type: 'boolean', default: false, name: 'is_incomplete' })
  isIncomplete!: boolean;

  @Column({ type: 'text', array: true, default: () => "'{}'::text[]", name: 'anomalies' })
  anomalies!: string[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
