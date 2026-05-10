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
  meetingImageUrl: '/images/tours/tallinn-meeting-point-wide.jpg',
  secondaryMeetingImageUrl: '/images/tours/tallinn-meeting-point.jpg',
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
  additionalInfoNote: 'Groups are usually up to 17 people. For larger groups, 2–3 guides are assigned.',
  childPolicy: 'freeWithAdult',

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
  meetingImageUrl: '/images/tours/tallinn-meeting-point-wide.jpg',
  secondaryMeetingImageUrl: '/images/tours/tallinn-meeting-point.jpg',
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
  childPolicy: 'chargedAsGuest',
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

export const TALLINN_OLD_TOWN_RUSSIAN_TOUR: TourProductConfig = {
  id: 'tallinn-old-town-russian',
  slug: 'tallinn-old-town-russian',
  title: 'Tallinn Old Town Group Walking Tour in Russian',
  description:
    'Discover the highlights of Tallinn Old Town on a guided group walking tour in Russian.',
  durationText: '2 to 2.5 hours',
  meetingPointTitle: 'Meeting point',
  meetingPointDescription:
    'The tour starts from the Town Hall building. The guide will be waiting for you under the clock with a bright 120° sign in the Town Hall arcade on Town Hall Square.',
  meetingImageUrl: '/images/tours/tallinn-meeting-point-wide.jpg',
  secondaryMeetingImageUrl: '/images/tours/tallinn-meeting-point.jpg',
  currency: 'EUR',
  priceCents: 3500,
  slotTimes: ['10:00', '13:00', '15:30'],
  defaultCapacity: 17,
  maxGuests: 17,
  cutoffMinutes: 300,
  availabilityMode: 'local',
  pricingMode: 'perPayableGuest',
  badgeText: '120° Russian Group Tour',
  priceNote: '€35 per paying guest',
  capacityNote: 'Children under 12 free with 1 adult per 1 child',
  additionalInfoNote: 'Sales are managed manually. Booking closes 5 hours before the tour.',
  childPolicy: 'freeWithAdult',
  maxBookingsPerDay: 999,
  maxBookingsPerSlot: 17,

  octoProductId: '',
  octoOptionId: '',
  octoAdultUnitId: '',
  octoChildUnitId: '',
};

export const TALLINN_FOOD_TOUR: TourProductConfig = {
  id: 'tallinn-food-tour',
  slug: 'tallinn-food-tour',
  title: 'Tallinn Food Tour',
  description:
    'Discover Tallinn through Estonian food, drinks, and history on a guided 2-hour walking tour that combines the city’s story with its local flavors.',
  durationText: '2 hours',
  meetingPointTitle: 'Meeting point',
  meetingPointDescription:
    'The guide will be waiting with the Food Tour sign at the Town Hall building under the clock.',
  meetingImageUrl: '/images/tours/tallinn-meeting-point-wide.jpg',
  secondaryMeetingImageUrl: '/images/tours/food-tour-meeting-point.jpg',
  currency: 'EUR',
  priceCents: 8000,
  slotTimes: ['15:00'],
  defaultCapacity: 17,
  maxGuests: 17,
  cutoffMinutes: 1080,
  availabilityMode: 'local',
  pricingMode: 'perPayableGuest',
  badgeText: '120° Food Tour',
  priceNote: '€80 per guest',
  capacityNote: 'Daily at 15:00',
  additionalInfoNote: 'Sales are managed manually. Booking closes 18 hours before the tour.',
  childPolicy: 'chargedAsGuest',
  maxBookingsPerDay: 999,
  maxBookingsPerSlot: 17,

  octoProductId: '',
  octoOptionId: '',
  octoAdultUnitId: '',
  octoChildUnitId: '',
};

const TOUR_PRODUCTS: Record<string, TourProductConfig> = {
  [TALLINN_OLD_TOWN_TOUR.id]: TALLINN_OLD_TOWN_TOUR,
  [TALLINN_OLD_TOWN_PRIVATE_TOUR.id]: TALLINN_OLD_TOWN_PRIVATE_TOUR,
  [TALLINN_OLD_TOWN_RUSSIAN_TOUR.id]: TALLINN_OLD_TOWN_RUSSIAN_TOUR,
  [TALLINN_FOOD_TOUR.id]: TALLINN_FOOD_TOUR,
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
