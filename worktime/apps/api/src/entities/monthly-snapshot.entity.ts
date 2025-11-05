import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'monthly_snapshots' })
export class MonthlySnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int', name: 'year' })
  year!: number;

  @Column({ type: 'int', name: 'month' })
  month!: number;

  @Column({ type: 'int', default: 0, name: 'total_minutes' })
  totalMinutes!: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0, name: 'avg_minutes_per_day' })
  avgMinutesPerDay!: string;

  @Column({ type: 'int', default: 0, name: 'days_trasferta' })
  daysTrasferta!: number;

  @Column({ type: 'int', default: 0, name: 'days_not_trasferta' })
  daysNotTrasferta!: number;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb", name: 'buoni_count' })
  buoniCount!: Record<string, unknown>;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, name: 'computed_salary' })
  computedSalary!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
