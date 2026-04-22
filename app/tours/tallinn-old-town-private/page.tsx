import { notFound } from 'next/navigation';

import { TourLanding } from '@/components/tours/tour-landing';
import { getTourProductBySlug } from '@/lib/tours/config';

export const runtime = 'nodejs';

export default function TallinnOldTownPrivateTourPage() {
  const product = getTourProductBySlug('tallinn-old-town-private');

  if (!product) {
    notFound();
  }

  return <TourLanding product={product} />;
}
