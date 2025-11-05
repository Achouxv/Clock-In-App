import { Injectable } from '@nestjs/common';
import { RawClockType } from '../../../entities/raw-clock.entity';
import { JobSite } from '../../../entities/job-site.entity';
import { LUNCH_WINDOW, DINNER_WINDOW } from '@worktime/config/src/time';
import {
  ALLOWANCE_DINNER,
  ALLOWANCE_FOREIGN_DAILY,
  ALLOWANCE_LUNCH
} from '@worktime/config/src/allowances';
import { TravelRounding } from '@worktime/config/src/rounding';
import { isInsideLombardy } from '@worktime/config/src/regions';

export interface RawClockEventLike {
  id?: string;
  timestamp: Date;
  type: RawClockType;
  jobSiteId?: string | null;
}

export type ShiftAllowances = Partial<Record<'lunch' | 'dinner' | 'foreign_daily', number>>;

export interface ComputedShift {
  start: Date;
  end: Date;
  durationMinutes: number;
  allowances: ShiftAllowances;
  sourceEventIds: string[];
  isIncomplete: boolean;
  travelHours: number;
  isTrasferta: boolean;
  anomalies: string[];
}

export interface ShiftEngineContext {
  events: RawClockEventLike[];
  jobSite: JobSite;
  travelKm?: number;
  rounding: TravelRounding;
}

export interface SalaryBreakdown {
  minutes: number;
  travelHours: number;
  allowanceTotal: number;
  totalSalary: number;
}

function toRomeMinutes(date: Date): number {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  const parts = fmt.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

function windowOverlaps(start: Date, end: Date, [windowStart, windowEnd]: [string, string]): boolean {
  const [startHour, startMinute] = windowStart.split(':').map(Number);
  const [endHour, endMinute] = windowEnd.split(':').map(Number);
  const shiftStart = toRomeMinutes(start);
  const shiftEnd = toRomeMinutes(end);
  const windowStartMinutes = startHour * 60 + startMinute;
  const windowEndMinutes = endHour * 60 + endMinute;

  // handle shifts that cross midnight by normalising to 24h window
  const adjustedShiftEnd = shiftEnd < shiftStart ? shiftEnd + 24 * 60 : shiftEnd;
  const adjustedWindowEnd = windowEndMinutes < windowStartMinutes ? windowEndMinutes + 24 * 60 : windowEndMinutes;

  const startPoints = [shiftStart, shiftStart + (adjustedShiftEnd >= 24 * 60 ? 24 * 60 : 0)];
  const endPoints = [adjustedShiftEnd, adjustedShiftEnd + (adjustedShiftEnd >= 24 * 60 ? 24 * 60 : 0)];
  const windowStartCandidates = [windowStartMinutes, windowStartMinutes + (adjustedWindowEnd >= 24 * 60 ? 24 * 60 : 0)];
  const windowEndCandidates = [adjustedWindowEnd, adjustedWindowEnd + (adjustedWindowEnd >= 24 * 60 ? 24 * 60 : 0)];

  for (let i = 0; i < startPoints.length; i++) {
    for (let j = 0; j < windowStartCandidates.length; j++) {
      if (Math.max(startPoints[i], windowStartCandidates[j]) < Math.min(endPoints[i], windowEndCandidates[j])) {
        return true;
      }
    }
  }
  return false;
}

export function travelHoursFromKm(km: number, rounding: TravelRounding): number {
  const base = km / 100;
  if (rounding === TravelRounding.FLOOR) {
    return Math.floor(base);
  }
  if (rounding === TravelRounding.NEAREST_HALF) {
    return Math.round(base * 2) / 2;
  }
  return Number(base.toFixed(2));
}

interface PauseAccumulator {
  totalMinutes: number;
  anomalies: string[];
}

function computePauseMinutes(events: RawClockEventLike[], startIdx: number, endIdx: number): PauseAccumulator {
  let totalPause = 0;
  const anomalies: string[] = [];
  let currentStart: Date | null = null;

  for (let i = startIdx; i <= endIdx; i++) {
    const event = events[i];
    if (event.type === RawClockType.PAUSE_START) {
      if (currentStart) {
        anomalies.push('pause_overlap');
      }
      currentStart = event.timestamp;
    } else if (event.type === RawClockType.PAUSE_END) {
      if (!currentStart) {
        anomalies.push('pause_end_without_start');
        continue;
      }
      totalPause += Math.max(0, (event.timestamp.getTime() - currentStart.getTime()) / 60000);
      currentStart = null;
    }
  }

  if (currentStart) {
    anomalies.push('pause_without_end');
  }

  return { totalMinutes: Math.round(totalPause), anomalies };
}

export function buildShifts(context: ShiftEngineContext): ComputedShift[] {
  const { events, jobSite, travelKm = 0, rounding } = context;
  if (!events.length) {
    return [];
  }

  const shifts: ComputedShift[] = [];
  let lastEnd: Date | null = null;
  const travelHours = travelHoursFromKm(travelKm, rounding);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.type !== RawClockType.IN) {
      continue;
    }
    let outIndex = -1;
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].type === RawClockType.OUT) {
        outIndex = j;
        break;
      }
    }

    let start = event.timestamp;
    let end = start;
    let isIncomplete = false;
    const sourceEventIds: string[] = [];
    if (event.id) {
      sourceEventIds.push(event.id);
    }
    if (outIndex >= 0) {
      const outEvent = events[outIndex];
      if (outEvent) {
        end = outEvent.timestamp;
        if (outEvent.id) {
          sourceEventIds.push(outEvent.id);
        }
      } else {
        isIncomplete = true;
      }
    } else {
      isIncomplete = true;
    }

    const pauseData = outIndex >= 0 ? computePauseMinutes(events, i + 1, outIndex - 1) : { totalMinutes: 0, anomalies: [] };
    const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000) - pauseData.totalMinutes);
    const anomalies = [...pauseData.anomalies];

    if (isIncomplete) {
      anomalies.push('incomplete');
    }
    if (lastEnd && start < lastEnd) {
      anomalies.push('overlap');
      const previous = shifts[shifts.length - 1];
      previous.anomalies = Array.from(new Set([...previous.anomalies, 'overlap']));
    }

    const allowances: ShiftAllowances = {};
    let isTrasferta = false;
    if (jobSite.country !== 'Italy') {
      allowances.foreign_daily = 1;
      isTrasferta = true;
    } else if (!isInsideLombardy({ region: jobSite.region, country: jobSite.country })) {
      isTrasferta = true;
      if (windowOverlaps(start, end, LUNCH_WINDOW)) {
        allowances.lunch = 1;
      }
      if (windowOverlaps(start, end, DINNER_WINDOW)) {
        allowances.dinner = 1;
      }
    }

    shifts.push({
      start,
      end,
      durationMinutes,
      allowances,
      sourceEventIds,
      isIncomplete,
      travelHours,
      isTrasferta,
      anomalies
    });

    lastEnd = end;
    if (outIndex >= 0) {
      i = outIndex;
    }
  }

  return shifts;
}

export function computeSalaryForShift(shift: ComputedShift, hourlyRate: number): SalaryBreakdown {
  const minutesPortion = (shift.durationMinutes / 60) * hourlyRate;
  const travelPortion = shift.travelHours * hourlyRate;
  const allowanceTotal =
    (shift.allowances.lunch ?? 0) * ALLOWANCE_LUNCH +
    (shift.allowances.dinner ?? 0) * ALLOWANCE_DINNER +
    (shift.allowances.foreign_daily ?? 0) * ALLOWANCE_FOREIGN_DAILY;

  const totalSalary = minutesPortion + travelPortion + allowanceTotal;
  return {
    minutes: shift.durationMinutes,
    travelHours: shift.travelHours,
    allowanceTotal,
    totalSalary
  };
}

@Injectable()
export class ShiftEngineService {
  buildShifts(context: ShiftEngineContext): ComputedShift[] {
    return buildShifts(context);
  }

  computeSalary(shift: ComputedShift, hourlyRate: number): SalaryBreakdown {
    return computeSalaryForShift(shift, hourlyRate);
  }
}
