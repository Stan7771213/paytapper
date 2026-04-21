import { getTourProductById } from './config';
import { getOctoAvailability } from './octo';
import { BOOKING_CUTOFF_MINUTES } from './validation';
import type { AvailabilityResponse, SlotAvailability } from './types';

export interface AvailabilityProvider {
  getAvailability(params: {
    productId: string;
    date: string;
  }): Promise<AvailabilityResponse>;
}

export class OctoAvailabilityProvider implements AvailabilityProvider {
  async getAvailability(params: {
    productId: string;
    date: string;
  }): Promise<AvailabilityResponse> {
    const product = getTourProductById(params.productId);

    if (!product) {
      throw new Error(`Unknown tour product: ${params.productId}`);
    }

    const octoSlots = await getOctoAvailability({
      productId: product.octoProductId,
      optionId: product.octoOptionId,
      localDate: params.date,
    });

    const slotsByTime = new Map(octoSlots.map((slot) => [slot.time, slot]));

    const slots: SlotAvailability[] = product.slotTimes.map((time) => {
      const octoSlot = slotsByTime.get(time);

      if (!octoSlot) {
        return {
          date: params.date,
          time,
          capacityTotal: product.defaultCapacity,
          capacityRemaining: 0,
          isBookable: false,
          cutoffMinutes: BOOKING_CUTOFF_MINUTES,
        };
      }

      return {
        date: params.date,
        time,
        capacityTotal: octoSlot.capacityTotal,
        capacityRemaining: octoSlot.capacityRemaining,
        isBookable: octoSlot.isBookable,
        cutoffMinutes: BOOKING_CUTOFF_MINUTES,
        octoAvailabilityId: octoSlot.octoAvailabilityId,
        utcCutoffAt: octoSlot.utcCutoffAt,
      };
    });

    return {
      productId: product.id,
      date: params.date,
      slots,
    };
  }
}

export function getAvailabilityProvider(): AvailabilityProvider {
  return new OctoAvailabilityProvider();
}
