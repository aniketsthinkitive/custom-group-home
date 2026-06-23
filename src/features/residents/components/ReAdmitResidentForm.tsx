import { useEffect, useMemo, useState } from "react";
import { Grid, Typography, Avatar } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs, { Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";

import CustomSelect from "../../../components/custom-select/custom-select";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../components/custom-label/custom-label";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import {
  retrieveGroupHomeOptions,
  listGroupHomesOptions,
} from "../../../sdk/@tanstack/react-query.gen";

/* =========================
   Types
========================= */
type FormValues = {
  moveInDate: Dayjs | null;
  financialStartDate: Dayjs | null;
  groupHome: string;
  roomId: string;
};

type Props = {
  resident: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading?: boolean;
};

/* =========================
   Validation Schema
========================= */
const schema = yup.object({
  moveInDate: yup.mixed().required("Move-in date is required"),
  groupHome: yup.string().required("Group home is required"),
  roomId: yup.string().required("Room is required"),
});

/* =========================
   Component
========================= */
const ReAdmitResidentForm = ({
  resident,
  onSubmit,
  onClose,
  isLoading = false,
}: Props) => {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      moveInDate: null,
      // financialStartDate: null,
      groupHome: "",
      roomId: "",
    },
  });

  /* =========================
    Fetch Group Homes
  ========================= */
  const { data: groupHomesResponse } = useQuery({
    ...listGroupHomesOptions({
      query: { page: 1, size: 1000 },
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const groupHomesList = useMemo(() => {
    const responseData = groupHomesResponse as any;
    if (!responseData?.data) return [];
    if (Array.isArray(responseData.data)) return responseData.data;
    if (Array.isArray(responseData.data.results)) return responseData.data.results;
    if (Array.isArray(responseData.data.content)) return responseData.data.content;
    return [];
  }, [groupHomesResponse]);

  const groupHomeIdToUuidMap = useMemo(() => {
    const map = new Map<string, string>();
    groupHomesList.forEach((home: any) => {
      if (home.id && home.uuid) {
        map.set(String(home.id), home.uuid);
      }
    });
    return map;
  }, [groupHomesList]);

  // Only show group homes that have at least one available room (same as Transfer Resident)
  const GROUP_HOME_OPTIONS = useMemo(() => {
    const listIncludesRooms = groupHomesList.some((home: any) =>
      Array.isArray(home.rooms),
    );
    return groupHomesList
      .filter((home: any) => {
        if (home?.active !== true) return false;
        const rooms = home.rooms || [];
        if (!listIncludesRooms) return true;
        if (rooms.length === 0) return false;
        const availableRooms = rooms.filter(
          (r: any) => r.is_active !== false && r.is_occupied === false,
        );
        return availableRooms.length > 0;
      })
      .map((home: any) => ({
        value: home.uuid,
        label: home.name || "Unknown Group Home",
      }));
  }, [groupHomesList]);

  /* =========================
    Fetch Rooms for selected GH
  ========================= */
  const [selectedGroupHomeUuid, setSelectedGroupHomeUuid] = useState<
    string | null
  >(null);
  const [hasUserSelectedGh, setHasUserSelectedGh] = useState(false);
  const selectedGroupHome = watch("groupHome");

  useEffect(() => {
    if (!selectedGroupHome) {
      setSelectedGroupHomeUuid(null);
      setHasUserSelectedGh(false);
    }
  }, [selectedGroupHome]);

  // Reset form + local state whenever the drawer is opened for a different
  // resident. Without this, react-hook-form keeps the previously selected
  // group home / room / move-in date because the drawer stays mounted on close.
  useEffect(() => {
    reset({
      moveInDate: null,
      groupHome: "",
      roomId: "",
    });
    setSelectedGroupHomeUuid(null);
    setHasUserSelectedGh(false);
  }, [resident?.assignment_uuid, reset]);

  const { data: groupHomeDetailResponse, isLoading: isRoomsLoading } =
    useQuery({
      ...retrieveGroupHomeOptions({
        path: { uuid: selectedGroupHomeUuid || "" },
      }),
      enabled: !!selectedGroupHomeUuid && hasUserSelectedGh,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });

  const ROOM_OPTIONS = useMemo(() => {
    const groupHome = (groupHomeDetailResponse as any)?.data;
    if (!groupHome?.rooms || !Array.isArray(groupHome.rooms)) return [];

    return groupHome.rooms
      .filter(
        (room: any) => room.is_active !== false && room.is_occupied === false,
      )
      .map((room: any) => ({
        value: room.uuid,
        label: room.room_number
          ? `Room ${room.room_number}`
          : `Room ${room.uuid}`,
      }))
      .sort((a: any, b: any) => {
        const aNum = parseInt(a.label.replace(/\D/g, ""), 10);
        const bNum = parseInt(b.label.replace(/\D/g, ""), 10);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.label.localeCompare(b.label);
      });
  }, [groupHomeDetailResponse]);

  /* Reset Room on GH change */
  useEffect(() => {
    setValue("roomId", "");
  }, [selectedGroupHomeUuid, setValue]);

  if (!resident) return null;

  /* =========================
     Submit
  ========================= */
  const submitHandler = (data: FormValues) => {
    const payload = {
      check_in_date: dayjs(data.moveInDate).format("YYYY-MM-DD"),
      // financial_effective_date: data.financialStartDate
      //   ? dayjs(data.financialStartDate).format("YYYY-MM-DD")
      //   : null,
      room: data.roomId,
      group_home_uuid: data.groupHome,
      status: "ACTIVE",
    };

    onSubmit({
      assignmentUuid: resident.assignment_uuid,
      payload,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Grid container direction="column" sx={{ height: "100%" }}>
        {/* Resident Strip */}
        <Grid
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: { xs: 1.5, sm: 2 },
            backgroundColor: "#F3F8FF",
            borderRadius: "8px",
            mb: 2,
          }}
        >
          <Avatar
            src={resident?.avatar_url ?? undefined}
            sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}
          >
            {resident?.resident_name?.[0]}
          </Avatar>
          <Typography sx={{ fontSize: { xs: 13, sm: 14 }, fontWeight: 600 }}>
            {resident?.resident_name}
          </Typography>
        </Grid>

        {/* Form Content */}
        <Grid sx={{ flex: 1 }}>
          {/* Row 1: Move-in Date (left) and Group Home (right) */}
          <Grid
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              mb: 2,
            }}
          >
            <Grid sx={{ flex: 1, minWidth: 0 }}>
              <CustomLabel label="Move-in Date" isRequired />
              <Controller
                name="moveInDate"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.moveInDate}
                    errorMessage={errors.moveInDate?.message}
                  />
                )}
              />
            </Grid>

            <Grid
              sx={{
                width: { xs: "100%", sm: "260px", md: "280px" },
                minWidth: { sm: "240px", md: "260px" },
                flexShrink: 0,
              }}
            >
              <CustomLabel label="Group Home" isRequired />
              <Controller
                name="groupHome"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    placeholder="Select Group Home"
                    name={field.name}
                    value={field.value}
                    onChange={(e) => {
                      const id = String(e.target.value);
                      field.onChange(id);
                      setHasUserSelectedGh(true);
                      setSelectedGroupHomeUuid(id || null);
                    }}
                    items={GROUP_HOME_OPTIONS}
                    hasError={!!errors.groupHome}
                    errorMessage={errors.groupHome?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Row 2: Room (left) and empty (right) */}
          <Grid
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              mb: 2,
            }}
          >
            <Grid sx={{ flex: 1, minWidth: 0 }}>
              <CustomLabel label="Room" isRequired />
              <Controller
                name="roomId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    placeholder="Select Room"
                    name={field.name}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    items={ROOM_OPTIONS}
                    hasError={!!errors.roomId}
                    errorMessage={errors.roomId?.message}
                    isDisabled={
                      isRoomsLoading ||
                      !ROOM_OPTIONS.length ||
                      !hasUserSelectedGh
                    }
                  />
                )}
              />
            </Grid>

            <Grid sx={{ flex: 1, minWidth: 0 }} />
          </Grid>
        </Grid>

        {/* Footer */}
        <Grid
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: { xs: 1.5, sm: 2 },
            pt: 2,
            pb: 2,
            mb: 2,
            borderTop: "1px solid #E3ECEF",
          }}
        >
          <CustomButton variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" loading={isLoading} disabled={isLoading}>
            Save
          </CustomButton>
        </Grid>
      </Grid>
    </form>
  );
};

export default ReAdmitResidentForm;
