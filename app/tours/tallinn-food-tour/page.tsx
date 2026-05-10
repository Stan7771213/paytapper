import { notFound } from 'next/navigation';

import { TourLanding } from '@/components/tours/tour-landing';
import { getTourProductBySlug } from '@/lib/tours/config';

export const runtime = 'nodejs';

export default function TallinnFoodTourPage() {
  const product = getTourProductBySlug('tallinn-food-tour');

  if (!product) {
    notFound();
  }

  return <TourLanding product={product} />;
}
