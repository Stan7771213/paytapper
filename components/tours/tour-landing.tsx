import Image from 'next/image';

import type { TourProduct } from '@/lib/tours/types';
import { BookingForm } from './booking-form';

type TourLandingProps = {
  product: TourProduct;
};

export function TourLanding({ product }: TourLandingProps) {
  const fallbackPrice = (product.priceCents / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.08fr_0.92fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center rounded-full bg-[#E7FF00] px-4 py-1 text-sm font-semibold text-black">
            {product.badgeText ?? '120° Tour'}
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {product.title}
            </h1>
            <p className="max-w-2xl text-base text-gray-300 md:text-lg">
              {product.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                {product.priceNote ?? `€${fallbackPrice}`}
              </div>
              <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                Duration: {product.durationText}
              </div>
              {product.capacityNote ? (
                <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                  {product.capacityNote}
                </div>
              ) : null}
              {product.additionalInfoNote ? (
                <div className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                  {product.additionalInfoNote}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="relative aspect-[16/10] w-full bg-neutral-900">
                <Image
                  src={product.meetingImageUrl}
                  alt={`${product.meetingPointTitle} overview`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="border-t border-white/10 px-4 py-3 text-sm text-gray-300">
                1. Look for the Town Hall building on Town Hall Square.
              </div>
            </div>

            {product.secondaryMeetingImageUrl ? (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="relative aspect-[16/10] w-full bg-neutral-900">
                  <Image
                    src={product.secondaryMeetingImageUrl}
                    alt={`${product.meetingPointTitle} guide`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="border-t border-white/10 px-4 py-3 text-sm text-gray-300">
                  2. Then look for the guide waiting with the bright 120° sign.
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-white">{product.meetingPointTitle}</h2>
            <p className="mt-3 leading-7 text-gray-300">{product.meetingPointDescription}</p>
          </div>
        </section>

        <aside>
          <BookingForm product={product} />
        </aside>
      </div>
    </div>
  );
}
