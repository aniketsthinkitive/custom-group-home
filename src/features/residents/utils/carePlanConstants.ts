import dayjs from "dayjs";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const currentYear = dayjs().year();
export const YEARS = Array.from({ length: 8 }, (_, i) => String(currentYear - 2 + i));

export type ShiftOption = {
  key: "morning" | "evening" | "night";
  label: string;
  time: string;
};

export const SHIFT_OPTIONS: ShiftOption[] = [
  { key: "morning", label: "Morning", time: "6:00 AM - 2:00 PM" },
  { key: "evening", label: "Evening", time: "2:00 PM - 10:00 PM" },
  { key: "night", label: "Night", time: "10:00 PM - 6:00 AM" },
];

export const MONTH_INDEX_MAP: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

export const API_SHIFT_MAP: Record<string, "MORNING" | "EVENING" | "NIGHT"> = {
  morning: "MORNING",
  evening: "EVENING",
  night: "NIGHT",
};

export const UI_SHIFT_MAP: Record<"MORNING" | "EVENING" | "NIGHT", "morning" | "evening" | "night"> = {
  MORNING: "morning",
  EVENING: "evening",
  NIGHT: "night",
};

export const STATUS_MAP: Record<string, "WORKED" | "DID_NOT_WORK" | "COULD_NOT_WORK"> = {
  worked: "WORKED",
  not_worked: "DID_NOT_WORK",
  could_not: "COULD_NOT_WORK",
};

export const API_TO_UI_STATUS_MAP: Record<"WORKED" | "DID_NOT_WORK" | "COULD_NOT_WORK", "worked" | "not_worked" | "could_not"> = {
  WORKED: "worked",
  DID_NOT_WORK: "not_worked",
  COULD_NOT_WORK: "could_not",
};

export type UiStatus = "worked" | "not_worked" | "could_not";
export type ApiStatus = "WORKED" | "DID_NOT_WORK" | "COULD_NOT_WORK";
export type ShiftKey = "morning" | "evening" | "night";
export type ApiShift = "MORNING" | "EVENING" | "NIGHT";
