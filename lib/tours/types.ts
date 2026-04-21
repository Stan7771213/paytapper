export type TourSlotTime = '10:00' | '13:00' | '15:30';

export type TourProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationText: string;
  meetingPointTitle: string;
  meetingPointDescription: string;
  meetingImageUrl: string;
  currency: 'EUR';
  priceCents: number;
  slotTimes: TourSlotTime[];
  defaultCapacity: number;
};

export type SlotAvailability = {
  date: string; // YYYY-MM-DD
  time: TourSlotTime;
  capacityTotal: number;
  capacityRemaining: number;
  isBookable: boolean;
  cutoffMinutes: number;
  octoAvailabilityId?: string;
  utcCutoffAt?: string | null;
};

export type AvailabilityResponse = {
  productId: string;
  date: string;
  slots: SlotAvailability[];
};
