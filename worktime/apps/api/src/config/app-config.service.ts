import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TravelRounding } from '@worktime/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get timezoneDefault(): string {
    return this.configService.get<string>('TIMEZONE_DEFAULT', 'Europe/Rome');
  }

  get hourlyRateDefault(): number {
    const raw = this.configService.get<string>('HOURLY_RATE_DEFAULT', '0');
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  get travelRounding(): TravelRounding {
    const raw = this.configService.get<string>('TRAVEL_ROUNDING', TravelRounding.FRACTIONAL);
    if (!raw) {
      return TravelRounding.FRACTIONAL;
    }

    const match = Object.values(TravelRounding).find((value) => value === raw);
    return match ?? TravelRounding.FRACTIONAL;
  }
}
