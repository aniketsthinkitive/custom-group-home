// src/constant/mockdata/addGroupHomeDrawer.ts
import type { Dayjs } from "dayjs";
import type { FileItem } from "../../components/custom-fileupload/custom-fileupload";

export const CITY_OPTIONS = [
  { value: "new-york", label: "New York" },
  { value: "los-angeles", label: "Los Angeles" },
  { value: "chicago", label: "Chicago" },
  { value: "houston", label: "Houston" },
  { value: "phoenix", label: "Phoenix" },
  { value: "philadelphia", label: "Philadelphia" },
  { value: "san-antonio", label: "San Antonio" },
  { value: "san-diego", label: "San Diego" },
  { value: "dallas", label: "Dallas" },
  { value: "san-jose", label: "San Jose" },
  { value: "austin", label: "Austin" },
  { value: "jacksonville", label: "Jacksonville" },
  { value: "san-francisco", label: "San Francisco" },
  { value: "columbus", label: "Columbus" },
  { value: "fort-worth", label: "Fort Worth" },
  { value: "charlotte", label: "Charlotte" },
  { value: "seattle", label: "Seattle" },
  { value: "denver", label: "Denver" },
  { value: "washington", label: "Washington" },
  { value: "boston", label: "Boston" },
] as const;

export type AddGroupHomeDefaultValues = {
  groupHomeName: string;
  timeZone: string;
  contactNumber: string;
  faxNumber: string;
  emailId: string;
  licenseNumber: string;
  emergencyContactNumber: string;
  licenseStartDate: Dayjs | null;
  licenseExpiryDate: Dayjs | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  numberOfRooms: string;
  certificateFiles: FileItem[];
  certificateMediaIds: string[];
  shifts: {
    morning: { enabled: boolean; from: string; fromAmPm: "AM" | "PM"; to: string; toAmPm: "AM" | "PM" };
    evening: { enabled: boolean; from: string; fromAmPm: "AM" | "PM"; to: string; toAmPm: "AM" | "PM" };
    night: { enabled: boolean; from: string; fromAmPm: "AM" | "PM"; to: string; toAmPm: "AM" | "PM" };
  };
  groupHomeImage: File | null;
};

export const defaultValues: AddGroupHomeDefaultValues = {
  groupHomeName: "",
  timeZone: "",
  contactNumber: "",
  faxNumber: "",
  emailId: "",
  licenseNumber: "",
  emergencyContactNumber: "",
  licenseStartDate: null,
  licenseExpiryDate: null,
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "United States",
  numberOfRooms: "",
  certificateFiles: [],
  certificateMediaIds: [],
  shifts: {
    morning: { enabled: false, from: "06:00", fromAmPm: "AM", to: "02:00", toAmPm: "PM" },
    evening: { enabled: false, from: "02:00", fromAmPm: "PM", to: "10:00", toAmPm: "PM" },
    night: { enabled: false, from: "10:00", fromAmPm: "PM", to: "06:00", toAmPm: "AM" },
  },
  groupHomeImage: null,
};
