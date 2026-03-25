'use client';

import { useEffect, useMemo, useState } from 'react';

import type { AvailabilityResponse, SlotAvailability, TourProduct } from '@/lib/tours/types';
import { getTodayDateString } from '@/lib/tours/validation';

type BookingFormProps = {
  product: TourProduct;
};

type FormState = {
  name: string;
  countryCode: string;
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
  const maxGuests = Math.max(0, params.maxGuests);

  while (adults + children > maxGuests && children > 0) {
    children -= 1;
  }

  while (adults + children > maxGuests && adults > 1) {
    adults -= 1;
  }

  if (maxGuests > 0 && adults > maxGuests) {
    adults = maxGuests;
  }

  if (maxGuests === 0) {
    return { adults: 1, children: 0 };
  }

  return { adults, children };
}

function normalizeSelectedDate(value: string): string {
  const today = getTodayDateString();
  if (!value) return today;
  return value < today ? today : value;
}

const COUNTRY_CODES = [
  { value: '+372', label: '🇪🇪 +372' },
  { value: '+358', label: '🇫🇮 +358' },
  { value: '+371', label: '🇱🇻 +371' },
  { value: '+370', label: '🇱🇹 +370' },
  { value: '+48', label: '🇵🇱 +48' },
  { value: '+49', label: '🇩🇪 +49' },
  { value: '+44', label: '🇬🇧 +44' },
  { value: '+33', label: '🇫🇷 +33' },
  { value: '+39', label: '🇮🇹 +39' },
  { value: '+34', label: '🇪🇸 +34' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+7', label: '🇰🇿/🇷🇺 +7' },
  { value: '+380', label: '🇺🇦 +380' },
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
    phone: '',
    email: '',
    adults: 1,
    children: 0,
    date: getTodayDateString(),
    time: '',
  });
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
          maxGuests: nextSelected.capacityRemaining,
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
  }, [form.date, product.id, form.time, form.adults, form.children]);

  const selectedSlot = useMemo(() => {
    return slots.find((slot) => slot.time === form.time) ?? null;
  }, [slots, form.time]);

  const capacityRemaining = selectedSlot?.capacityRemaining ?? 0;
  const totalGuests = form.adults + form.children;
  const freeChildren = Math.min(form.children, form.adults);
  const extraPaidChildren = Math.max(form.children - form.adults, 0);
  const payableGuests = form.adults + extraPaidChildren;
  const totalPriceCents = payableGuests * product.priceCents;
  const totalPrice = (totalPriceCents / 100).toFixed(2);
  const canIncreaseAdults = selectedSlot ? totalGuests < capacityRemaining : false;
  const canIncreaseChildren = selectedSlot ? totalGuests < capacityRemaining : false;

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
      maxGuests: slot.capacityRemaining,
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

    try {
      const response = await fetch('/api/tours/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          name: form.name,
          countryCode: form.countryCode,
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
          <p className="text-sm uppercase tracking-wide text-[#E7FF00]">Book your group tour</p>
          <h2 className="text-2xl font-semibold text-white">Reserve your spot</h2>
        </div>
        <div className="rounded-full bg-[#E7FF00] px-3 py-1 text-sm font-semibold text-black">
          120°
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="tour-name">Name</FieldLabel>
        <input
          id="tour-name"
          type="text"
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
          required
          autoComplete="name"
          className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-white">
          Phone / WhatsApp <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
          <select
            value={form.countryCode}
            onChange={(event) => updateField('countryCode', event.target.value)}
            className="rounded-2xl border border-white/20 bg-black px-3 py-3 text-white outline-none"
            aria-label="Country code"
          >
            {COUNTRY_CODES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            id="tour-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            required
            minLength={5}
            pattern="[0-9\s\-()]{5,20}"
            placeholder="Phone number"
            className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-500"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Please enter your full phone number including country code.
        </p>
      </div>

      <div>
        <FieldLabel htmlFor="tour-email">Email</FieldLabel>
        <input
          id="tour-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          required
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
          placeholder="name@example.com"
          className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-500"
        />
        <p className="mt-2 text-xs text-gray-500">
          Please enter a valid email address.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black p-4">
          <div className="mb-2">
            <p className="text-sm font-medium text-white">
              Adults <span className="text-red-400">*</span>
            </p>
            <p className="text-xs text-gray-400">Age 12 to 65+</p>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={decrementAdults}
              className="rounded-xl border border-white/20 px-4 py-2 text-white"
            >
              -
            </button>
            <div className="text-xl font-semibold text-white">{form.adults}</div>
            <button
              type="button"
              onClick={incrementAdults}
              disabled={!canIncreaseAdults}
              className="rounded-xl border border-white/20 px-4 py-2 text-white disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black p-4">
          <div className="mb-2">
            <p className="text-sm font-medium text-white">Children under 12</p>
            <p className="text-xs text-gray-400">1 adult = 1 free child</p>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={decrementChildren}
              className="rounded-xl border border-white/20 px-4 py-2 text-white"
            >
              -
            </button>
            <div className="text-xl font-semibold text-white">{form.children}</div>
            <button
              type="button"
              onClick={incrementChildren}
              disabled={!canIncreaseChildren}
              className="rounded-xl border border-white/20 px-4 py-2 text-white disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="tour-date">Date</FieldLabel>

        <div className="relative">
          <input
            id="tour-date"
            type="date"
            min={getTodayDateString()}
            value={form.date}
            onChange={(event) => handleDateChange(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 pr-12 text-white outline-none"
          />
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/70">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18" />
            </svg>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Only today and future dates are allowed.
        </p>
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-white">
          Time <span className="text-red-400">*</span>
        </p>
        <div className="grid gap-3">
          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-gray-400">
              Loading available times...
            </div>
          ) : null}

          {!isLoading && slots.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-gray-400">
              No available tours for the selected date.
            </div>
          ) : null}

          {!isLoading &&
            slots.map((slot) => {
              const isActive = form.time === slot.time;

              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => selectTime(slot.time)}
                  className={[
                    'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                    isActive
                      ? 'border-[#E7FF00] bg-[#E7FF00] text-black'
                      : 'border-white/15 bg-black text-white hover:border-[#E7FF00]/50',
                  ].join(' ')}
                >
                  <span className="font-medium">{slot.time}</span>
                  <span className={isActive ? 'text-black/80' : 'text-gray-400'}>
                    {slot.capacityRemaining} places left
                  </span>
                </button>
              );
            })}
        </div>

        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm">
        <div className="flex items-center justify-between text-gray-300">
          <span>Total participants</span>
          <span>{totalGuests}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-gray-300">
          <span>Free children covered by adults</span>
          <span>{freeChildren}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-gray-300">
          <span>Extra paid children</span>
          <span>{extraPaidChildren}</span>
        </div>
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-base font-semibold text-white">
            <span>Payable guests</span>
            <span>{payableGuests}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xl font-semibold text-[#E7FF00]">
            <span>Total</span>
            <span>€{totalPrice}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black p-4 text-xs leading-6 text-gray-400">
        Tickets are non-refundable and non-exchangeable after purchase.
      </div>

      {submitError ? (
        <p className="text-sm text-red-400">{submitError}</p>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-2xl bg-[#E7FF00] px-4 py-3 font-semibold text-black disabled:opacity-50"
        disabled={isLoading || isSubmitting || !form.time || !selectedSlot}
      >
        {isSubmitting ? 'Redirecting to payment...' : 'Continue to payment'}
      </button>
    </form>
  );
}
