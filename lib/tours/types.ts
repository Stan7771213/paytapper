export type TourSlotTime = string;

export type TourAvailabilityMode = 'octo' | 'local';
export type TourPricingMode = 'perPayableGuest' | 'privateTiered';

export type TourPriceTier = {
  minGuests: number;
  maxGuests: number;
  amountCents: number;
  label: string;
};

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
  maxGuests: number;
  cutoffMinutes: number;
  availabilityMode: TourAvailabilityMode;
  pricingMode: TourPricingMode;
  badgeText?: string;
  priceNote?: string;
  capacityNote?: string;
  privatePriceTiers?: TourPriceTier[];
  maxBookingsPerDay?: number;
  maxBookingsPerSlot?: number;
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
