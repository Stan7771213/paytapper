type ClosedDateRule = {
  productId: string;
  date: string;
};

type ClosedSlotRule = {
  productId: string;
  date: string;
  time: string;
};

type CutoffOverrideRule = {
  productId: string;
  date: string;
  time: string;
  cutoffMinutes: number;
};

export const LOCAL_TOUR_RULES = {
  closedDates: [] as ClosedDateRule[],
  closedSlots: [] as ClosedSlotRule[],
  cutoffOverrides: [] as CutoffOverrideRule[],
};

export function isLocalDateClosed(productId: string, date: string): boolean {
  return LOCAL_TOUR_RULES.closedDates.some(
    (rule) => rule.productId === productId && rule.date === date,
  );
}

export function isLocalSlotClosed(
  productId: string,
  date: string,
  time: string,
): boolean {
  return LOCAL_TOUR_RULES.closedSlots.some(
    (rule) =>
      rule.productId === productId &&
      rule.date === date &&
      rule.time === time,
  );
}

export function resolveLocalCutoffMinutes(params: {
  productId: string;
  date: string;
  time: string;
  defaultCutoffMinutes: number;
}): number {
  const override = LOCAL_TOUR_RULES.cutoffOverrides.find(
    (rule) =>
      rule.productId === params.productId &&
      rule.date === params.date &&
      rule.time === params.time,
  );

  return override?.cutoffMinutes ?? params.defaultCutoffMinutes;
}
