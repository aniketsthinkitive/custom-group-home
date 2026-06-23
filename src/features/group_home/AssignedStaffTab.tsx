import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { listUsersOptions } from "../../sdk/@tanstack/react-query.gen";

const ROLE_FILTERS: { label: string; value: string; roleNames: string[] }[] = [
  { label: "DSPs", value: "DSP", roleNames: ["dsp"] },
  {
    label: "Program Managers",
    value: "PROGRAM_MANAGER",
    roleNames: ["program manager"],
  },
  {
    label: "Coordinators",
    value: "PROGRAM_COORDINATOR",
    roleNames: ["program coordinator"],
  },
];

type GroupHomeUser = {
  uuid: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  active?: boolean;
  role?: {
    name?: string | null;
    type?: string | null;
  } | null;
};

type UsersResponse = {
  data?: {
    results?: GroupHomeUser[];
    data?: GroupHomeUser[];
  } | GroupHomeUser[];
};

const getUsersFromResponse = (response: unknown): GroupHomeUser[] => {
  const data = response as UsersResponse | undefined;
  const payload = data?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getUserName = (user: GroupHomeUser) => {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return fullName || user.email || "Unnamed user";
};

const getInitials = (user: GroupHomeUser) => {
  const name = getUserName(user);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export default function AssignedStaffTab({ homeUuid }: { homeUuid: string }) {
  const [tab, setTab] = useState(0);
  const selectedRole = ROLE_FILTERS[tab];

  const { data: usersResponse, isLoading, isError } = useQuery({
    ...listUsersOptions({
      query: {
        group_home_uuid: homeUuid,
        page: 1,
        size: 1000,
        status: "active",
      },
    }),
    enabled: !!homeUuid,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    const users = getUsersFromResponse(usersResponse);
    return users.filter((user) => {
      const roleName = (user.role?.name || "").trim().toLowerCase();
      return selectedRole.roleNames.includes(roleName);
    });
  }, [selectedRole, usersResponse]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {ROLE_FILTERS.map((filter) => (
            <Tab key={filter.value} label={filter.label} />
          ))}
        </Tabs>
      </Stack>

      <Stack spacing={1}>
        {isLoading && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography color="text.secondary">Loading staff...</Typography>
          </Stack>
        )}

        {!isLoading && isError && (
          <Typography color="error">
            Failed to load assigned staff. Please try again.
          </Typography>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <Typography color="text.secondary">
            No assignments in this role.
          </Typography>
        )}

        {!isLoading &&
          !isError &&
          items.map((user) => (
            <Stack
              key={user.uuid}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ p: 1, border: "1px solid #eee", borderRadius: 1 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 36, height: 36, fontSize: 14 }}>
                  {getInitials(user)}
                </Avatar>
                <Box>
                  <Typography variant="body1">{getUserName(user)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email || "-"}
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={user.role?.name || selectedRole.label}
                size="small"
                sx={{ backgroundColor: "#EAF4FF", color: "#0A4778" }}
              />
            </Stack>
          ))}
      </Stack>
    </Box>
  );
}
