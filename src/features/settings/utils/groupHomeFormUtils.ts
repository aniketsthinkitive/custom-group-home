import dayjs from "dayjs";
import type { GroupHome, GroupHomeWritable } from "../../../sdk/types.gen";
import { timezoneLabels } from "../../../constant/timezoneOptions";
import type { FormState as AddGroupHomeFormState } from "../components/AddGroupHomeDrawer";

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

export const convert24To12Hour = (
  time24: string
): { time: string; amPm: "AM" | "PM" } => {
  if (!time24) return { time: "", amPm: "AM" };
  const [hours, minutes] = time24.split(":").map(Number);
  const amPm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return {
    time: `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    amPm,
  };
};

export const convertTo24HourTime = (
  time12: string,
  amPm: "AM" | "PM"
): string => {
  if (!time12) return "00:00";
  const [hours, minutes] = time12.split(":").map(Number);
  let hours24 = hours;
  if (amPm === "PM" && hours !== 12) hours24 = hours + 12;
  if (amPm === "AM" && hours === 12) hours24 = 0;
  return `${hours24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export const formatTimeForAPI = (time24: string): string => `${time24}:00`;

export const mapTimezoneToEnum = (
  ianaTimezone: string
): "Eastern Time" | "Central Time" | "Mountain Time" | "Pacific Time" | "Arizona Time" | "Alaska Time" | null => {
  const timezoneOption = timezoneLabels.find((tz) => tz.value === ianaTimezone);
  return timezoneOption ? (timezoneOption.label as ReturnType<typeof mapTimezoneToEnum>) : null;
};

// ---------------------------------------------------------------------------
// API GroupHome → Form state (for edit drawer initial values)
// ---------------------------------------------------------------------------

export function transformApiGroupHomeToFormState(
  apiGroupHome: GroupHome
): Partial<AddGroupHomeFormState> {
  const mapTimezoneToIana = (timezoneEnum: unknown): string => {
    if (!timezoneEnum || typeof timezoneEnum !== "string") return "";
    const tzOption = timezoneLabels.find((tz) => tz.label === timezoneEnum);
    return tzOption?.value ?? "";
  };

  const defaultShifts: AddGroupHomeFormState["shifts"] = {
    morning: { enabled: false, from: "", fromAmPm: "AM", to: "", toAmPm: "AM" },
    evening: { enabled: false, from: "", fromAmPm: "AM", to: "", toAmPm: "AM" },
    night: { enabled: false, from: "", fromAmPm: "AM", to: "", toAmPm: "AM" },
  };

  const transformShifts = (): AddGroupHomeFormState["shifts"] => {
    if (!apiGroupHome.shifts || apiGroupHome.shifts.length === 0) {
      return defaultShifts;
    }
    const shifts = { ...defaultShifts };
    apiGroupHome.shifts.forEach((shift) => {
      if (!shift.is_active) return;
      const from12 = convert24To12Hour(shift.start_time);
      const to12 = convert24To12Hour(shift.end_time);
      if (shift.shift === "MORNING") {
        shifts.morning = {
          enabled: true,
          from: from12.time,
          fromAmPm: from12.amPm,
          to: to12.time,
          toAmPm: to12.amPm,
        };
      } else if (shift.shift === "EVENING") {
        shifts.evening = {
          enabled: true,
          from: from12.time,
          fromAmPm: from12.amPm,
          to: to12.time,
          toAmPm: to12.amPm,
        };
      } else if (shift.shift === "NIGHT") {
        shifts.night = {
          enabled: true,
          from: from12.time,
          fromAmPm: from12.amPm,
          to: to12.time,
          toAmPm: to12.amPm,
        };
      }
    });
    return shifts;
  };

  const certificateMediaIds =
    apiGroupHome.media?.map((m) => m.id) ?? [];

  return {
    groupHomeName: apiGroupHome.name ?? "",
    timeZone: mapTimezoneToIana(apiGroupHome.timezone as unknown),
    contactNumber: apiGroupHome.phone ?? "",
    faxNumber: apiGroupHome.fax ?? "",
    emailId: apiGroupHome.email ?? "",
    licenseNumber: apiGroupHome.license?.number ?? "",
    emergencyContactNumber: apiGroupHome.emergency_contact_number ?? "",
    licenseStartDate: apiGroupHome.license?.start_date
      ? dayjs(String(apiGroupHome.license.start_date))
      : null,
    licenseExpiryDate: apiGroupHome.license?.expiry_date
      ? dayjs(String(apiGroupHome.license.expiry_date))
      : null,
    addressLine1: apiGroupHome.address?.line1 ?? "",
    addressLine2: apiGroupHome.address?.line2 ?? "",
    city: apiGroupHome.address?.city ?? "",
    state: apiGroupHome.address?.state ?? "",
    zipCode: apiGroupHome.address?.zipcode ?? "",
    country: apiGroupHome.address?.country ?? "",
    numberOfRooms: apiGroupHome.no_of_rooms?.toString() ?? "",
    certificateFiles: [],
    certificateMediaIds,
    groupHomeImageFiles: [],
    shifts: transformShifts(),
  };
}

// ---------------------------------------------------------------------------
// Form state → API payload (GroupHomeWritable)
// ---------------------------------------------------------------------------

export function transformFormDataToPayload(
  formData: AddGroupHomeFormState
): GroupHomeWritable {
  const shifts: NonNullable<GroupHomeWritable["shifts"]> = [];

  if (formData.shifts.morning.enabled) {
    shifts.push({
      shift: "MORNING",
      start_time: formatTimeForAPI(
        convertTo24HourTime(
          formData.shifts.morning.from,
          formData.shifts.morning.fromAmPm
        )
      ),
      end_time: formatTimeForAPI(
        convertTo24HourTime(
          formData.shifts.morning.to,
          formData.shifts.morning.toAmPm
        )
      ),
      is_active: true,
    });
  }
  if (formData.shifts.evening.enabled) {
    shifts.push({
      shift: "EVENING",
      start_time: formatTimeForAPI(
        convertTo24HourTime(
          formData.shifts.evening.from,
          formData.shifts.evening.fromAmPm
        )
      ),
      end_time: formatTimeForAPI(
        convertTo24HourTime(
          formData.shifts.evening.to,
          formData.shifts.evening.toAmPm
        )
      ),
      is_active: true,
    });
  }
  if (formData.shifts.night.enabled) {
    shifts.push({
      shift: "NIGHT",
      start_time: formatTimeForAPI(
        convertTo24HourTime(
          formData.shifts.night.from,
          formData.shifts.night.fromAmPm
        )
      ),
      end_time: formatTimeForAPI(
        convertTo24HourTime(
          formData.shifts.night.to,
          formData.shifts.night.toAmPm
        )
      ),
      is_active: true,
    });
  }

  const phoneNumber = formData.contactNumber.replace(/\D/g, "").slice(0, 10);
  const faxNumber = formData.faxNumber.replace(/\D/g, "").slice(0, 10);
  const emergencyNumber = formData.emergencyContactNumber
    .replace(/\D/g, "")
    .slice(0, 10);

  const payload: GroupHomeWritable = {
    name: formData.groupHomeName.trim(),
    timezone: mapTimezoneToEnum(formData.timeZone) ?? null,
    phone: phoneNumber,
    fax: faxNumber,
    email: formData.emailId.trim() ?? "",
    emergency_contact_number: emergencyNumber ?? "",
    no_of_rooms: formData.numberOfRooms
      ? parseInt(formData.numberOfRooms, 10) : 0,
    active: true,
    address: {
      line1: formData.addressLine1.trim(),
      line2: formData.addressLine2.trim() || null,
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipcode: formData.zipCode.trim(),
      country: formData.country.trim(),
    },
    license: formData.licenseNumber.trim()
      ? {
          number: formData.licenseNumber.trim(),
          start_date: formData.licenseStartDate
            ? formData.licenseStartDate.toISOString()
            : null,
          expiry_date: formData.licenseExpiryDate
            ? formData.licenseExpiryDate.toISOString()
            : null,
        }
      : undefined,
    shifts: shifts,
    certificate_media_ids: formData.certificateMediaIds,
  } as GroupHomeWritable;

  return payload;
}

/**
 * Add or clear image_media_id for group home avatar.
 * - undefined: do not include (no change to avatar)
 * - null: clear avatar (backend unlinks profile image)
 * - string: set avatar to this media UUID
 */
export function withImageMediaId(
  payload: GroupHomeWritable,
  imageMediaId: string | null | undefined
): GroupHomeWritable {
  if (imageMediaId === undefined) return payload;
  return { ...payload, image_media_id: imageMediaId } as GroupHomeWritable;
}
