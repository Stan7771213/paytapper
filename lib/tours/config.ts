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

  octoProductId: '70ef96f8-9d54-4beb-80b2-26f0137fbcc7',
  octoOptionId: '6aa3fadd-5281-4f82-a7df-e4e38343f631',
  octoAdultUnitId: '1',
  octoChildUnitId: '2',
};

const TOUR_PRODUCTS: Record<string, TourProductConfig> = {
  [TALLINN_OLD_TOWN_TOUR.id]: TALLINN_OLD_TOWN_TOUR,
};

export function getTourProductById(productId: string): TourProductConfig | null {
  return TOUR_PRODUCTS[productId] ?? null;
}

export function getTourProductBySlug(slug: string): TourProductConfig | null {
  return Object.values(TOUR_PRODUCTS).find((product) => product.slug === slug) ?? null;
}
