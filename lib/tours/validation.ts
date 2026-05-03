import type { TourSlotTime } from './types';

export const BOOKING_CUTOFF_MINUTES = 15;
const SLOT_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TOUR_TIME_ZONE = 'Europe/Tallinn';

function getTallinnNowParts(): {
  date: string;
  minutes: number;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TOUR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  const date = `${map.year}-${map.month}-${map.day}`;
  const minutes = Number(map.hour) * 60 + Number(map.minute);

  return { date, minutes };
}

function shiftDateString(date: string, deltaDays: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + deltaDays);
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidSlotTime(value: string): value is TourSlotTime {
  return SLOT_TIME_PATTERN.test(value);
}

export function getTodayDateString(): string {
  return getTallinnNowParts().date;
}

export function isDateInPast(date: string): boolean {
  return date < getTodayDateString();
}

export function buildLocalDateTime(date: string, time: TourSlotTime): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function isSlotPastCutoff(params: {
  date: string;
  time: TourSlotTime;
  cutoffMinutes?: number;
}): boolean {
  const cutoffMinutes = params.cutoffMinutes ?? BOOKING_CUTOFF_MINUTES;
  const { date: todayTallinn, minutes: nowMinutesTallinn } = getTallinnNowParts();

  const [hours, minutes] = params.time.split(':').map(Number);
  const slotMinutes = hours * 60 + minutes;

  let cutoffDate = params.date;
  let cutoffAtMinutes = slotMinutes - cutoffMinutes;

  if (cutoffAtMinutes < 0) {
    cutoffDate = shiftDateString(params.date, -1);
    cutoffAtMinutes += 24 * 60;
  }

  if (todayTallinn > cutoffDate) return true;
  if (todayTallinn < cutoffDate) return false;

  return nowMinutesTallinn >= cutoffAtMinutes;
}

export function clampGuests(value: number, maxGuests: number): number {
  if (value < 1) return 1;
  if (value > maxGuests) return maxGuests;
  return value;
}
