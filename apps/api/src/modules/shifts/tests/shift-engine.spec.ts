import { JobSite } from '../../../entities/job-site.entity';
import { RawClockType } from '../../../entities/raw-clock.entity';
import {
  buildShifts,
  computeSalaryForShift,
  travelHoursFromKm
} from '../services/shift-engine.service';
import { TravelRounding } from '@worktime/config/src/rounding';

function createJobSite(overrides: Partial<JobSite>): JobSite {
  return {
    id: 'job-site',
    name: 'Test',
    address: 'addr',
    city: 'city',
    province: 'province',
    region: 'Lombardia',
    country: 'Italy',
    lat: 0,
    lon: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as JobSite;
}

function date(value: string): Date {
  return new Date(value);
}

describe('ShiftEngineService', () => {
  it('computes simple shift with pause inside Lombardia without allowances', () => {
    const jobSite = createJobSite({ region: 'Lombardia', country: 'Italy' });
    const shifts = buildShifts({
      events: [
        { type: RawClockType.IN, timestamp: date('2025-11-12T08:00:00+01:00') },
        { type: RawClockType.PAUSE_START, timestamp: date('2025-11-12T12:00:00+01:00') },
        { type: RawClockType.PAUSE_END, timestamp: date('2025-11-12T12:30:00+01:00') },
        { type: RawClockType.OUT, timestamp: date('2025-11-12T17:00:00+01:00') }
      ],
      jobSite,
      rounding: TravelRounding.FRACTIONAL
    });

    expect(shifts).toHaveLength(1);
    expect(shifts[0].durationMinutes).toBe(8 * 60 - 30);
    expect(shifts[0].allowances).toEqual({});
  });

  it('marks lunch allowance outside Lombardia when overlapping lunch window', () => {
    const jobSite = createJobSite({ region: 'Emilia-Romagna', country: 'Italy' });
    const shifts = buildShifts({
      events: [
        { type: RawClockType.IN, timestamp: date('2025-11-12T09:00:00+01:00') },
        { type: RawClockType.OUT, timestamp: date('2025-11-12T15:00:00+01:00') }
      ],
      jobSite,
      rounding: TravelRounding.FRACTIONAL
    });

    expect(shifts[0].allowances).toEqual({ lunch: 1 });
    expect(shifts[0].isTrasferta).toBe(true);
  });

  it('marks dinner allowance outside Lombardia when overlapping dinner window', () => {
    const jobSite = createJobSite({ region: 'Emilia-Romagna', country: 'Italy' });
    const shifts = buildShifts({
      events: [
        { type: RawClockType.IN, timestamp: date('2025-11-12T17:30:00+01:00') },
        { type: RawClockType.OUT, timestamp: date('2025-11-12T21:30:00+01:00') }
      ],
      jobSite,
      rounding: TravelRounding.FRACTIONAL
    });

    expect(shifts[0].allowances).toEqual({ dinner: 1 });
  });

  it('sets foreign allowance outside Italy', () => {
    const jobSite = createJobSite({ region: 'Ticino', country: 'Switzerland' });
    const shifts = buildShifts({
      events: [
        { type: RawClockType.IN, timestamp: date('2025-11-12T08:00:00+01:00') },
        { type: RawClockType.OUT, timestamp: date('2025-11-12T17:00:00+01:00') }
      ],
      jobSite,
      rounding: TravelRounding.FRACTIONAL
    });

    expect(shifts[0].allowances).toEqual({ foreign_daily: 1 });
    expect(shifts[0].isTrasferta).toBe(true);
  });

  it('rounds travel hours according to strategy', () => {
    expect(travelHoursFromKm(230, TravelRounding.FRACTIONAL)).toBeCloseTo(2.3);
    expect(travelHoursFromKm(230, TravelRounding.NEAREST_HALF)).toBe(2.5);
    expect(travelHoursFromKm(230, TravelRounding.FLOOR)).toBe(2);
  });

  it('handles multiple shifts in one day', () => {
    const jobSite = createJobSite({ region: 'Emilia-Romagna', country: 'Italy' });
    const shifts = buildShifts({
      events: [
        { type: RawClockType.IN, timestamp: date('2025-11-12T08:00:00+01:00') },
        { type: RawClockType.OUT, timestamp: date('2025-11-12T12:00:00+01:00') },
        { type: RawClockType.IN, timestamp: date('2025-11-12T13:00:00+01:00') },
        { type: RawClockType.OUT, timestamp: date('2025-11-12T18:30:00+01:00') }
      ],
      jobSite,
      rounding: TravelRounding.FRACTIONAL
    });

    expect(shifts).toHaveLength(2);
  });

  it('flags incomplete shift when missing out event', () => {
    const jobSite = createJobSite({ region: 'Lombardia', country: 'Italy' });
    const shifts = buildShifts({
      events: [
        { type: RawClockType.IN, timestamp: date('2025-11-12T08:00:00+01:00') }
      ],
      jobSite,
      rounding: TravelRounding.FRACTIONAL
    });

    expect(shifts[0].isIncomplete).toBe(true);
    expect(shifts[0].anomalies).toContain('incomplete');
  });

  it('computes salary with allowances and travel', () => {
    const jobSite = createJobSite({ region: 'Emilia-Romagna', country: 'Italy' });
    const [shift] = buildShifts({
      events: [
        { type: RawClockType.IN, timestamp: date('2025-11-12T09:00:00+01:00') },
        { type: RawClockType.OUT, timestamp: date('2025-11-12T19:30:00+01:00') }
      ],
      jobSite,
      rounding: TravelRounding.FRACTIONAL,
      travelKm: 200
    });

    const salary = computeSalaryForShift(shift, 18);
    expect(salary.travelHours).toBeCloseTo(2);
    expect(salary.allowanceTotal).toBeGreaterThan(0);
    expect(salary.totalSalary).toBeGreaterThan(0);
  });
});
