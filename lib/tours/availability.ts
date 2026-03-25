import { getTourProductById } from './config';
import {
  BOOKING_CUTOFF_MINUTES,
  isDateInPast,
  isSlotPastCutoff,
} from './validation';
import type { AvailabilityResponse, SlotAvailability, TourProduct } from './types';

export interface AvailabilityProvider {
  getAvailability(params: {
    productId: string;
    date: string;
  }): Promise<AvailabilityResponse>;
}

function buildLocalSlotAvailability(product: TourProduct, date: string): SlotAvailability[] {
  return product.slotTimes.map((time) => {
    const isPast = isDateInPast(date);
    const isCutoff = isSlotPastCutoff({ date, time, cutoffMinutes: BOOKING_CUTOFF_MINUTES });
    const isBookable = !isPast && !isCutoff;

    return {
      date,
      time,
      capacityTotal: product.defaultCapacity,
      capacityRemaining: isBookable ? product.defaultCapacity : 0,
      isBookable,
      cutoffMinutes: BOOKING_CUTOFF_MINUTES,
    };
  });
}

export class LocalAvailabilityProvider implements AvailabilityProvider {
  async getAvailability(params: {
    productId: string;
    date: string;
  }): Promise<AvailabilityResponse> {
    const product = getTourProductById(params.productId);

    if (!product) {
      throw new Error(`Unknown tour product: ${params.productId}`);
    }

    return {
      productId: product.id,
      date: params.date,
      slots: buildLocalSlotAvailability(product, params.date),
    };
  }
}

export function getAvailabilityProvider(): AvailabilityProvider {
  return new LocalAvailabilityProvider();
}
