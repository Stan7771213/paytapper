import type { TourSlotTime } from './types';

export const BOOKING_CUTOFF_MINUTES = 15;
export const ALLOWED_SLOT_TIMES: TourSlotTime[] = ['10:00', '13:00', '15:30'];

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidSlotTime(value: string): value is TourSlotTime {
  return ALLOWED_SLOT_TIMES.includes(value as TourSlotTime);
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const slotDate = buildLocalDateTime(params.date, params.time);
  const cutoffDate = new Date(slotDate.getTime() - cutoffMinutes * 60 * 1000);
  return new Date().getTime() > cutoffDate.getTime();
}

export function clampGuests(value: number, maxGuests: number): number {
  if (value < 1) return 1;
  if (value > maxGuests) return maxGuests;
  return value;
}
