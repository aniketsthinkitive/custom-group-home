export interface TimezoneOption {
  key: string;
  value: string;
}

// Legacy timezone options (deprecated - use IANA identifiers)
export const timezoneOptions: TimezoneOption[] = [
  { key: "America/New_York", value: "Eastern Time" },
  { key: "America/Chicago", value: "Central Time" },
  { key: "America/Denver", value: "Mountain Time" },
  { key: "America/Los_Angeles", value: "Pacific Time" },
  { key: "America/Phoenix", value: "Arizona Time" },
  { key: "America/Anchorage", value: "Alaska Time" },
  // { key: "Pacific/Honolulu", value: "Hawaii Time" },
];

// IANA timezone identifiers for healthcare applications
export const timezoneLabels = [
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Phoenix", label: "Arizona Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  // { value: "Pacific/Honolulu", label: "Hawaii Time" },
];
