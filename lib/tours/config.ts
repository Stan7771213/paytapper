import type { TourProduct } from './types';

export type TourProductConfig = TourProduct & {
  octoProductId: string;
  octoOptionId: string;
  octoAdultUnitId: string;
  octoChildUnitId: string;
};

export const TALLINN_OLD_TOWN_TOUR: TourProductConfig = {
  id: 'tallinn-old-town',
  slug: 'tallinn-old-town',
  title: 'Tallinn Old Town Group Walking Tour',
  description:
    'Join a guided group walking tour through the highlights of Tallinn Old Town.',
  durationText: '2 to 2.5 hours',
  meetingPointTitle: 'Meeting point',
  meetingPointDescription:
    'At 10 am, 1 pm and 3:30 pm the tour starts from the Town Hall building. The guide will be waiting for you under the clock with a bright sign with the 120 degrees logo in the Town Hall arcade on Town Hall Square.',
  meetingImageUrl: '/images/tours/tallinn-meeting-point.jpg',
  currency: 'EUR',
  priceCents: 3500,
  slotTimes: ['10:00', '13:00', '15:30'],
  defaultCapacity: 20,
  maxGuests: 20,
  cutoffMinutes: 15,
  availabilityMode: 'octo',
  pricingMode: 'perPayableGuest',
  badgeText: '120° Group Tour',
  priceNote: '€35 per paying guest',
  capacityNote: 'Children under 12 free with 1 adult per 1 child',

  octoProductId: '70ef96f8-9d54-4beb-80b2-26f0137fbcc7',
  octoOptionId: '6aa3fadd-5281-4f82-a7df-e4e38343f631',
  octoAdultUnitId: '1',
  octoChildUnitId: '2',
};

export const TALLINN_OLD_TOWN_PRIVATE_TOUR: TourProductConfig = {
  id: 'tallinn-old-town-private',
  slug: 'tallinn-old-town-private',
  title: 'Tallinn Old Town Private Walking Tour',
  description:
    'Enjoy a private 2-hour walking tour through the highlights of Tallinn Old Town with your own guide.',
  durationText: '2 hours',
  meetingPointTitle: 'Meeting point',
  meetingPointDescription:
    'The private tour starts from Town Hall Square. Your guide will meet you near the Town Hall building.',
  meetingImageUrl: '/images/tours/tallinn-meeting-point.jpg',
  currency: 'EUR',
  priceCents: 15000,
  slotTimes: ['16:00'],
  defaultCapacity: 15,
  maxGuests: 15,
  cutoffMinutes: 180,
  availabilityMode: 'local',
  pricingMode: 'privateTiered',
  badgeText: '120° Private Tour',
  priceNote: '€150 for 1–4 guests · €200 for 5–15 guests',
  capacityNote: 'One private tour per day for now',
  privatePriceTiers: [
    {
      minGuests: 1,
      maxGuests: 4,
      amountCents: 15000,
      label: '€150 for 1–4 guests',
    },
    {
      minGuests: 5,
      maxGuests: 15,
      amountCents: 20000,
      label: '€200 for 5–15 guests',
    },
  ],
  maxBookingsPerDay: 1,
  maxBookingsPerSlot: 1,

  octoProductId: '',
  octoOptionId: '',
  octoAdultUnitId: '',
  octoChildUnitId: '',
};

const TOUR_PRODUCTS: Record<string, TourProductConfig> = {
  [TALLINN_OLD_TOWN_TOUR.id]: TALLINN_OLD_TOWN_TOUR,
  [TALLINN_OLD_TOWN_PRIVATE_TOUR.id]: TALLINN_OLD_TOWN_PRIVATE_TOUR,
};

export function getTourProductById(productId: string): TourProductConfig | null {
  return TOUR_PRODUCTS[productId] ?? null;
}

export function getTourProductBySlug(slug: string): TourProductConfig | null {
  return Object.values(TOUR_PRODUCTS).find((product) => product.slug === slug) ?? null;
}

export function getAllTourProducts(): TourProductConfig[] {
  return Object.values(TOUR_PRODUCTS);
}
