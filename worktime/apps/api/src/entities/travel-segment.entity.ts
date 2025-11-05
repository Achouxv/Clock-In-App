import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'travel_segments' })
export class TravelSegment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'date', name: 'date' })
  date!: string;

  @Column({ type: 'int', name: 'km' })
  km!: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, name: 'computed_travel_hours' })
  computedTravelHours!: string;

  @Column({ type: 'text', name: 'source' })
  source!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
