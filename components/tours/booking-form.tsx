'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  AvailabilityResponse,
  SlotAvailability,
  TourPriceTier,
  TourProduct,
} from '@/lib/tours/types';
import { getTodayDateString } from '@/lib/tours/validation';

type BookingFormProps = {
  product: TourProduct;
};

type FormState = {
  name: string;
  countryCode: string;
  manualCountryCode: string;
  phone: string;
  email: string;
  adults: number;
  children: number;
  date: string;
  time: string;
};

function normalizeParty(params: {
  adults: number;
  children: number;
  maxGuests: number;
}): { adults: number; children: number } {
  let adults = Math.max(1, params.adults);
  let children = Math.max(0, params.children);
  const maxGuests = Math.max(1, params.maxGuests);

  while (adults + children > maxGuests && children > 0) {
    children -= 1;
  }

  while (adults + children > maxGuests && adults > 1) {
    adults -= 1;
  }

  if (adults > maxGuests) {
    adults = maxGuests;
  }

  return { adults, children };
}

function normalizeSelectedDate(value: string): string {
  const today = getTodayDateString();
  if (!value) return today;
  return value < today ? today : value;
}

function resolvePrivateTier(
  tiers: TourPriceTier[] | undefined,
  totalGuests: number,
): TourPriceTier | null {
  if (!tiers?.length) return null;
  return tiers.find(
    (tier) => totalGuests >= tier.minGuests && totalGuests <= tier.maxGuests,
  ) ?? null;
}

const COUNTRY_CODES = [
  { value: '+372', label: '🇪🇪 +372' },
  { value: '+358', label: '🇫🇮 +358' },
  { value: '+46', label: '🇸🇪 +46' },
  { value: '+47', label: '🇳🇴 +47' },
  { value: '+371', label: '🇱🇻 +371' },
  { value: '+370', label: '🇱🇹 +370' },
  { value: '+48', label: '🇵🇱 +48' },
  { value: '+44', label: '🇬🇧 +44' },
  { value: '+49', label: '🇩🇪 +49' },
  { value: '+31', label: '🇳🇱 +31' },
  { value: '+33', label: '🇫🇷 +33' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+39', label: '🇮🇹 +39' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+61', label: '🇦🇺 +61' },
  { value: '+91', label: '🇮🇳 +91' },
  { value: '+65', label: '🇸🇬 +65' },
  { value: '+86', label: '🇨🇳 +86' },
  { value: '+7', label: '🇰🇿/🇷🇺 +7' },
  { value: '+380', label: '🇺🇦 +380' },
  { value: 'OTHER', label: '🌍 Other' },
];

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-white">
      {children} <span className="text-red-400">*</span>
    </label>
  );
}

export function BookingForm({ product }: BookingFormProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    countryCode: '+372',
    manualCountryCode: '',
    phone: '',
    email: '',
    adults: 1,
    children: 0,
    date: getTodayDateString(),
    time: '',
  });
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      setIsLoading(true);
      setError(null);

      const safeDate = normalizeSelectedDate(form.date);

      if (safeDate !== form.date) {
        setForm((current) => ({
          ...current,
          date: safeDate,
        }));
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/tours/availability?productId=${encodeURIComponent(product.id)}&date=${encodeURIComponent(safeDate)}`,
          { method: 'GET', cache: 'no-store' },
        );

        if (!response.ok) {
          throw new Error('Failed to load availability');
        }

        const data = (await response.json()) as AvailabilityResponse;

        if (cancelled) return;

        const availableSlots = data.slots.filter((slot) => slot.isBookable);
        setSlots(availableSlots);

        const stillSelected = availableSlots.find((slot) => slot.time === form.time);
        const nextSelected = stillSelected ?? availableSlots[0] ?? null;

        if (!nextSelected) {
          setForm((current) => ({
            ...current,
            time: '',
            adults: 1,
            children: 0,
          }));
          return;
        }

        const normalized = normalizeParty({
          adults: form.adults,
          children: form.children,
          maxGuests: product.maxGuests,
        });

        setForm((current) => ({
          ...current,
          time: nextSelected.time,
          adults: normalized.adults,
          children: normalized.children,
        }));
      } catch (loadError) {
        if (cancelled) return;
        console.error(loadError);
        setSlots([]);
        setError('Could not load available times for the selected date.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [form.date, product.id, form.time, form.adults, form.children, product.maxGuests]);

  const selectedSlot = useMemo(() => {
    return slots.find((slot) => slot.time === form.time) ?? null;
  }, [slots, form.time]);

  const totalGuests = form.adults + form.children;
  const freeChildren = Math.min(form.children, form.adults);
  const extraPaidChildren = Math.max(form.children - form.adults, 0);
  const payableGuests = form.adults + extraPaidChildren;
  const privateTier = resolvePrivateTier(product.privatePriceTiers, totalGuests);

  const pricingSummary = useMemo(() => {
    if (product.pricingMode === 'privateTiered') {
      const amountCents = privateTier?.amountCents ?? 0;
      return {
        amountCents,
        totalPrice: (amountCents / 100).toFixed(2),
        lineLabel: privateTier?.label ?? 'Price unavailable for this group size',
        helperText:
          'Private tour pricing is per group, not per person.',
      };
    }

    const amountCents = payableGuests * product.priceCents;
    return {
      amountCents,
      totalPrice: (amountCents / 100).toFixed(2),
      lineLabel: `€${(product.priceCents / 100).toFixed(2)} per paying guest`,
      helperText:
        '1 adult covers 1 child under 12 for free. Extra children are charged as paying guests.',
    };
  }, [product.pricingMode, product.priceCents, product.privatePriceTiers, privateTier, payableGuests]);

  const canIncreaseAdults = totalGuests < product.maxGuests;
  const canIncreaseChildren = totalGuests < product.maxGuests;
  const isGroupSizeValid =
    product.pricingMode === 'privateTiered' ? privateTier !== null : true;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleDateChange(value: string) {
    updateField('date', normalizeSelectedDate(value));
  }

  function selectTime(time: string) {
    const slot = slots.find((item) => item.time === time);
    if (!slot) return;

    const normalized = normalizeParty({
      adults: form.adults,
      children: form.children,
      maxGuests: product.maxGuests,
    });

    setForm((current) => ({
      ...current,
      time,
      adults: normalized.adults,
      children: normalized.children,
    }));
  }

  function incrementAdults() {
    if (!canIncreaseAdults) return;
    setForm((current) => ({
      ...current,
      adults: current.adults + 1,
    }));
  }

  function decrementAdults() {
    setForm((current) => ({
      ...current,
      adults: Math.max(1, current.adults - 1),
    }));
  }

  function incrementChildren() {
    if (!canIncreaseChildren) return;
    setForm((current) => ({
      ...current,
      children: current.children + 1,
    }));
  }

  function decrementChildren() {
    setForm((current) => ({
      ...current,
      children: Math.max(0, current.children - 1),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const effectiveCountryCode =
      form.countryCode === 'OTHER' ? form.manualCountryCode.trim() : form.countryCode;

    if (product.pricingMode === 'privateTiered' && !privateTier) {
      setSubmitError('Selected group size is not supported for this private tour.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/tours/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          name: form.name,
          countryCode: effectiveCountryCode,
          phone: form.phone,
          email: form.email,
          adults: form.adults,
          children: form.children,
          date: form.date,
          time: form.time,
        }),
      });

      const data = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (submitErr) {
      console.error(submitErr);
      setSubmitError(
        submitErr instanceof Error ? submitErr.message : 'Unable to continue to payment',
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-[#E7FF00]/30 bg-[#111111] p-6 shadow-[0_0_0_1px_rgba(231,255,0,0.08)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#E7FF00]">
            {product.pricingMode === 'privateTiered' ? 'Book your private tour' : 'Book your group tour'}
          </p>
          <h2 className="text-2xl font-semibold text-white">Reserve your spot</h2>
        </div>
        <div className="rounded-full bg-[#E7FF00] px-3 py-1 text-sm font-semibold text-black">
          120°
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[#E7FF00]"
            placeholder="Your full name"
          />
        </div>

        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[#E7FF00]"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <FieldLabel htmlFor="countryCode">Phone / WhatsApp</FieldLabel>
          <div className="flex gap-2">
            <select
              id="countryCode"
              value={form.countryCode}
              onChange={(event) => updateField('countryCode', event.target.value)}
              className="w-[44%] rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-white outline-none transition focus:border-[#E7FF00]"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>

            <input
              type="tel"
              required
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="w-[56%] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[#E7FF00]"
              placeholder="55512345"
            />
          </div>

          {form.countryCode === 'OTHER' ? (
            <input
              type="text"
              required
              value={form.manualCountryCode}
              onChange={(event) => updateField('manualCountryCode', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[#E7FF00]"
              placeholder="Enter country code, e.g. +351"
            />
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="date">Date</FieldLabel>
          <div className="relative">
            <input
              ref={dateInputRef}
              id="date"
              type="date"
              required
              min={getTodayDateString()}
              value={form.date}
              onChange={(event) => handleDateChange(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[#E7FF00]"
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker?.()}
              className="absolute inset-y-0 right-2 my-auto rounded-full px-3 py-1 text-xs font-medium text-[#E7FF00]"
            >
              Pick
            </button>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="time">Time</FieldLabel>
          <div className="grid grid-cols-1 gap-2">
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300">
                Loading available times...
              </div>
            ) : slots.length > 0 ? (
              slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => selectTime(slot.time)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    form.time === slot.time
                      ? 'border-[#E7FF00] bg-[#E7FF00]/10 text-white'
                      : 'border-white/10 bg-black/30 text-gray-300 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{slot.time}</span>
                    <span className="text-xs text-gray-400">
                      booking closes {slot.cutoffMinutes} min before
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300">
                No available times for this date.
              </div>
            )}
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="adults">Adults</FieldLabel>
          <div className="flex items-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <button
              type="button"
              onClick={decrementAdults}
              className="px-4 py-3 text-xl text-white transition hover:bg-white/5"
            >
              −
            </button>
            <div className="flex-1 text-center text-white">{form.adults}</div>
            <button
              type="button"
              onClick={incrementAdults}
              className="px-4 py-3 text-xl text-white transition hover:bg-white/5"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="children">Children under 12</FieldLabel>
          <div className="flex items-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <button
              type="button"
              onClick={decrementChildren}
              className="px-4 py-3 text-xl text-white transition hover:bg-white/5"
            >
              −
            </button>
            <div className="flex-1 text-center text-white">{form.children}</div>
            <button
              type="button"
              onClick={incrementChildren}
              className="px-4 py-3 text-xl text-white transition hover:bg-white/5"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-[#E7FF00]">Price summary</p>
            <h3 className="mt-1 text-xl font-semibold text-white">
              Total: €{pricingSummary.totalPrice}
            </h3>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-sm text-white">
            {totalGuests} guest{totalGuests === 1 ? '' : 's'}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-300">
          <div className="flex items-center justify-between gap-4">
            <span>Pricing</span>
            <span className="text-right text-white">{pricingSummary.lineLabel}</span>
          </div>

          {product.pricingMode === 'perPayableGuest' ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <span>Adults</span>
                <span className="text-white">{form.adults}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Children under 12</span>
                <span className="text-white">{form.children}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Free children covered</span>
                <span className="text-white">{freeChildren}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Payable guests</span>
                <span className="text-white">{payableGuests}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <span>Adults</span>
                <span className="text-white">{form.adults}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Children under 12</span>
                <span className="text-white">{form.children}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Private group size</span>
                <span className="text-white">{totalGuests}</span>
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-sm leading-6 text-gray-400">{pricingSummary.helperText}</p>
      </div>

      {submitError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {submitError}
        </div>
      ) : null}

      {!isGroupSizeValid ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          This group size is not available for the selected private tour.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !form.time || isLoading || !isGroupSizeValid}
        className="w-full rounded-2xl bg-[#E7FF00] px-5 py-4 text-base font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Redirecting to payment...' : 'Continue to payment'}
      </button>
    </form>
  );
}
