import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'job_sites' })
@Index('idx_job_sites_region_country', ['region', 'country'])
export class JobSite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Column({ type: 'varchar', length: 120 })
  province!: string;

  @Column({ type: 'varchar', length: 120 })
  region!: string;

  @Column({ type: 'varchar', length: 120 })
  country!: string;

  @Column({ type: 'double precision', nullable: true, name: 'lat' })
  lat!: number | null;

  @Column({ type: 'double precision', nullable: true, name: 'lon' })
  lon!: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
