const PARAGUAY_OFFSET_MS = -3 * 60 * 60 * 1000;

export function toParaguayTime(date: Date): Date {
  return new Date(date.getTime() + PARAGUAY_OFFSET_MS);
}

export function nowParaguay(): Date {
  return toParaguayTime(new Date());
}
