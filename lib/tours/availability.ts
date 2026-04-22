import { getTourProductById } from './config';
import { getAllTourBookings } from './bookingStore';
import {
  isLocalDateClosed,
  isLocalSlotClosed,
  resolveLocalCutoffMinutes,
} from './localRules';
import { getOctoAvailability } from './octo';
import { BOOKING_CUTOFF_MINUTES, isDateInPast, isSlotPastCutoff } from './validation';
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

    if (product.availabilityMode !== 'octo') {
      throw new Error(`Product is not configured for OCTO availability: ${params.productId}`);
    }

    if (!product.octoProductId || !product.octoOptionId) {
      throw new Error(`Missing OCTO configuration for product: ${params.productId}`);
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
          cutoffMinutes: product.cutoffMinutes ?? BOOKING_CUTOFF_MINUTES,
        };
      }

      return {
        date: params.date,
        time,
        capacityTotal: octoSlot.capacityTotal,
        capacityRemaining: octoSlot.capacityRemaining,
        isBookable: octoSlot.isBookable,
        cutoffMinutes: product.cutoffMinutes ?? BOOKING_CUTOFF_MINUTES,
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

export class LocalAvailabilityProvider implements AvailabilityProvider {
  async getAvailability(params: {
    productId: string;
    date: string;
  }): Promise<AvailabilityResponse> {
    const product = getTourProductById(params.productId);

    if (!product) {
      throw new Error(`Unknown tour product: ${params.productId}`);
    }

    if (product.availabilityMode !== 'local') {
      throw new Error(`Product is not configured for local availability: ${params.productId}`);
    }

    const allBookings = await getAllTourBookings();
    const paidBookings = allBookings.filter(
      (booking) =>
        booking.productId === product.id &&
        booking.date === params.date &&
        booking.status === 'paid',
    );

    const isDateClosed = isLocalDateClosed(product.id, params.date);
    const dateIsPast = isDateInPast(params.date);

    const slots: SlotAvailability[] = product.slotTimes.map((time) => {
      const bookingsForTime = paidBookings.filter((booking) => booking.time === time);

      const cutoffMinutes = resolveLocalCutoffMinutes({
        productId: product.id,
        date: params.date,
        time,
        defaultCutoffMinutes: product.cutoffMinutes,
      });

      const dayCapacity = product.maxBookingsPerDay ?? product.defaultCapacity;
      const slotCapacity = product.maxBookingsPerSlot ?? product.defaultCapacity;

      const dayRemaining = Math.max(0, dayCapacity - paidBookings.length);
      const slotRemaining = Math.max(0, slotCapacity - bookingsForTime.length);
      const capacityRemaining = Math.max(0, Math.min(dayRemaining, slotRemaining));

      const slotClosed =
        isDateClosed ||
        dateIsPast ||
        isLocalSlotClosed(product.id, params.date, time) ||
        isSlotPastCutoff({
          date: params.date,
          time,
          cutoffMinutes,
        });

      return {
        date: params.date,
        time,
        capacityTotal: Math.min(dayCapacity, slotCapacity),
        capacityRemaining: slotClosed ? 0 : capacityRemaining,
        isBookable: !slotClosed && capacityRemaining > 0,
        cutoffMinutes,
      };
    });

    return {
      productId: product.id,
      date: params.date,
      slots,
    };
  }
}

class MixedAvailabilityProvider implements AvailabilityProvider {
  private octoProvider = new OctoAvailabilityProvider();
  private localProvider = new LocalAvailabilityProvider();

  async getAvailability(params: {
    productId: string;
    date: string;
  }): Promise<AvailabilityResponse> {
    const product = getTourProductById(params.productId);

    if (!product) {
      throw new Error(`Unknown tour product: ${params.productId}`);
    }

    if (product.availabilityMode === 'octo') {
      return this.octoProvider.getAvailability(params);
    }

    return this.localProvider.getAvailability(params);
  }
}

export function getAvailabilityProvider(): AvailabilityProvider {
  return new MixedAvailabilityProvider();
}
