import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobSite } from './entities/job-site.entity';
import { MonthlySnapshot } from './entities/monthly-snapshot.entity';
import { RawClock } from './entities/raw-clock.entity';
import { Shift } from './entities/shift.entity';
import { ShiftAudit } from './entities/shift-audit.entity';
import { TravelSegment } from './entities/travel-segment.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number.parseInt(configService.get<string>('DB_PORT', '5432') ?? '5432', 10),
        username: configService.get<string>('DB_USERNAME', 'worktime'),
        password: configService.get<string>('DB_PASSWORD', 'worktime'),
        database: configService.get<string>('DB_NAME', 'worktime'),
        entities: [User, JobSite, RawClock, Shift, TravelSegment, MonthlySnapshot, ShiftAudit],
        migrations: ['dist/migrations/*.js'],
        synchronize: false,
        autoLoadEntities: false
      })
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
