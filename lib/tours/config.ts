import type { TourProduct } from './types';

export const TALLINN_OLD_TOWN_TOUR: TourProduct = {
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
};

const TOUR_PRODUCTS: Record<string, TourProduct> = {
  [TALLINN_OLD_TOWN_TOUR.id]: TALLINN_OLD_TOWN_TOUR,
};

export function getTourProductById(productId: string): TourProduct | null {
  return TOUR_PRODUCTS[productId] ?? null;
}

export function getTourProductBySlug(slug: string): TourProduct | null {
  return Object.values(TOUR_PRODUCTS).find((product) => product.slug === slug) ?? null;
}
