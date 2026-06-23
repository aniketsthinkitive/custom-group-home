import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { listRolesPermissions } from "../../../sdk/sdk.gen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PermissionEntry {
  module: string;
  key: string;
  name: string;
  scope: "ALL" | "ASSIGNED_HOME";
  display?: string; // ✅ ADD THIS
}
interface RoleWithPermissions {
  uuid: string;
  name: string;
  type: string;
  description: string | null;
  permissions: PermissionEntry[];
}

/**
 * full          → all sub-permissions present and all scopes are "ALL"
 * assigned_home → all sub-permissions present and all scopes are "ASSIGNED_HOME"
 * partial       → mix of scopes, or some permissions missing
 * none          → role has zero permissions in this module
 */
type AccessLevel = "full" | "assigned_home" | "partial" | "none";

interface ModuleGroup {
  module: string;
  label: string;
  roleAccess: Record<string, AccessLevel>;
  /** True when at least one role has partial access — controls sub-row visibility */
  hasPartial: boolean;
  permissions: {
    key: string;
    name: string;
    roles: Record<string, { has: boolean; scope: string; display?: string }>;
  }[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Only these roles are displayed (in order) — keyed by unique name
const DISPLAY_ROLE_NAMES = [
  "Admin",
  "Program Director",
  "Program Manager",
  "BCBA",
  "Nurse",
  "Program Coordinator",
  "DSP",
] as const;

// Module display names
const MODULE_LABELS: Record<string, string> = {
  leads: "Lead Management",
  onboarding: "Onboarding & Profile",
  documents: "Document Management",
  consent_forms: "Consent & Forms",
  adls: "ADLs",
  daily_tracking: "Audit & System Logs",
  monthly_summary: "Monthly Summary",
  goals: "Goal / Activity Management",
  incidents: "Incident Management",
  appointments: "Appointment Management",
  group_homes: "Group Home Management",
  users: "User Management",
  // audit_logs: "Audit & System Logs",
  profile: "Profile Management",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RolesPermissionsTab: React.FC = () => {
  // Fetch roles with permissions
  const {
    data: rolesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["roles-permissions"],
    queryFn: async () => {
      const response = await listRolesPermissions();
      const result = response?.data as {
        status?: string;
        data?: RoleWithPermissions[];
      };
      return result?.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const allRoles = rolesData ?? [];

  // Filter to only the specified roles, in defined order (keyed by unique name)
  const roles = useMemo(() => {
    return DISPLAY_ROLE_NAMES.map((name) =>
      allRoles.find((r) => r.name === name)
    ).filter(Boolean) as RoleWithPermissions[];
  }, [allRoles]);

  // Build module groups with access level computation
  const moduleGroups = useMemo(() => {
    // Collect all unique permissions per module (across displayed roles)
    const modulePermMap = new Map<string, Map<string, string>>();
    for (const role of roles) {
      for (const perm of role.permissions) {
        if (!modulePermMap.has(perm.module)) {
          modulePermMap.set(perm.module, new Map());
        }
        modulePermMap.get(perm.module)!.set(perm.key, perm.name);
      }
    }

    const groups: ModuleGroup[] = [];
    const sortedModules = Array.from(modulePermMap.keys()).sort((a, b) => {
      const aLabel = MODULE_LABELS[a] || a;
      const bLabel = MODULE_LABELS[b] || b;
      return aLabel.localeCompare(bLabel);
    });

    for (const module of sortedModules) {
      const permsInModule = modulePermMap.get(module)!;
      const allPermKeys = Array.from(permsInModule.keys()).sort();
      const totalPerms = allPermKeys.length;

      // Determine access level per role — derived from scopes, not counts
      const roleAccess: Record<string, AccessLevel> = {};
      let hasPartial = false;

      for (const role of roles) {
        const rolePermsInModule = role.permissions.filter(
          (p) => p.module === module
        );

        if (rolePermsInModule.length === 0) {
          roleAccess[role.name] = "none";
          continue;
        }

        const allPermKeys = Array.from(permsInModule.keys());
        const hasAllPerms = allPermKeys.every((key) =>
          rolePermsInModule.some((p) => p.key === key)
        );
        const scopes = rolePermsInModule.map((p) => p.scope);
        const allAll = scopes.every((s) => s === "ALL");
        const allAssigned = scopes.every((s) => s === "ASSIGNED_HOME");

        if (hasAllPerms && allAll) {
          roleAccess[role.name] = "full";
        } else if (hasAllPerms && allAssigned) {
          roleAccess[role.name] = "assigned_home";
        } else {
          // Mixed scopes or missing some permissions
          roleAccess[role.name] = "partial";
          hasPartial = true;
        }
      }

      // Build individual permission rows
      const permissions = allPermKeys.map((key) => {
        const name = permsInModule.get(key) || key;
        const roleMap: Record<string, { has: boolean; scope: string ;display?: string}> = {};
        for (const role of roles) {
          const found = role.permissions.find(
            (p) => p.module === module && p.key === key
          );
          roleMap[role.name] = found
             ? { has: true, scope: found.scope, display: found.display }
             : { has: false, scope: "", display: "" };
        }
        return { key, name, roles: roleMap };
      });

     const isAuditLogs = module === "daily_tracking";
     const isProfile = module === "profile"; // ✅ new

groups.push({
  module,
  label: MODULE_LABELS[module] || module,
  roleAccess,
  hasPartial: isAuditLogs || isProfile ? true : hasPartial, // ✅ show sub-rows
  permissions,
});
    }

    return groups;
  }, [roles]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <Typography color="error">
          Failed to load roles and permissions
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* ── Permissions Matrix ────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
            flexShrink: 0,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Roles & Permissions 
          </Typography>
          <Typography variant="caption" color="text.secondary">
            View only
          </Typography>
        </Box>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "auto", // Enable horizontal scroll when table is wider than viewport
            width: "100%",
            maxWidth: "100%",
            position: "relative",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x pan-y",
            scrollbarWidth: "thin",
            scrollbarColor: "#D1D5DB #F3F4F6",
            "&::-webkit-scrollbar": {
              width: "6px",
              height: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#F3F4F6",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#D1D5DB",
              borderRadius: "3px",
              "&:hover": {
                backgroundColor: "#9CA3AF",
              },
            },
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "13px",
                    minWidth: 240,
                    backgroundColor: "#F8F9FA",
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    borderRight: "1px solid #E0E0E0",
                  }}
                >
                  Module / Permission
                </TableCell>
                {roles.map((role) => (
                  <TableCell
                    key={role.name}
                    align="center"
                    sx={{
                      fontWeight: 600,
                      fontSize: "13px",
                      minWidth: 130,
                      backgroundColor: "#F8F9FA",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {role.name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {moduleGroups.map((group) => (
                <React.Fragment key={group.module}>
                  {/* Module header row */}
                  <TableRow>
                    <TableCell
                      sx={{
                        backgroundColor: "#EEF2F6",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: "#1A1A2E",
                        py: 1.2,
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        borderRight: "1px solid #E0E0E0",
                      }}
                    >
                      {group.label}
                    </TableCell>
                    {roles.map((role) => {
  const access = group.roleAccess[role.name];

  // ✅ ADD THIS LINE
  const isAuditLogs = group.module === "daily_tracking";

  // ✅ NEW: handle audit_logs header
  if (isAuditLogs) {
    const hasAccess = group.permissions.some(
      (p) => p.roles[role.name]?.has
    );

    return (
      <TableCell
        key={role.name}
        align="center"
        sx={{ backgroundColor: "#EEF2F6", py: 1.2 }}
      >
        <Chip
          label={hasAccess ? "Full Access" : "No Access"}
          size="small"
          sx={{
            height: 24,
            fontSize: "11px",
            fontWeight: 500,
            backgroundColor: hasAccess ? "#E8F5E9" : "#F5F5F5",
            color: hasAccess ? "#2E7D32" : "#9E9E9E",
          }}
        />
      </TableCell>
    );
  }

  // ✅ KEEP EXISTING LOGIC
  if (access === "none") {
    return (
      <TableCell
        key={role.name}
        align="center"
        sx={{ backgroundColor: "#EEF2F6", py: 1.2 }}
      >
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontSize: "12px" }}
        >
          No Access
        </Typography>
      </TableCell>
    );
  }

  const chipProps =
    access === "full"
      ? { label: "Full Access", bg: "#E8F5E9", color: "#2E7D32" }
      : access === "assigned_home"
      ? { label: "Assigned Home", bg: "#FFF3E0", color: "#E65100" }
      : { label: "Partial Access", bg: "#FFF3E0", color: "#E65100" };

  return (
    <TableCell
      key={role.name}
      align="center"
      sx={{ backgroundColor: "#EEF2F6", py: 1.2 }}
    >
      <Chip
        label={chipProps.label}
        size="small"
        sx={{
          height: 24,
          fontSize: "11px",
          fontWeight: 500,
          backgroundColor: chipProps.bg,
          color: chipProps.color,
        }}
      />
    </TableCell>
  );
})}
                  </TableRow>

                  {/* Sub-permissions — only shown when any role has "customize" */}
                 {(group.hasPartial || group.module === "daily_tracking") &&
  group.permissions.map((perm) => (
                      <TableRow
                        key={`${group.module}.${perm.key}`}
                        hover
                        sx={{ "&:last-child td": { borderBottom: 0 } }}
                      >
                        <TableCell
                          sx={{
                            pl: 4,
                            fontSize: "13px",
                            color: "#555",
                            position: "sticky",
                            left: 0,
                            backgroundColor: "#fff",
                            zIndex: 1,
                            borderRight: "1px solid #E0E0E0",
                          }}
                        >
                          {perm.name}
                        </TableCell>
                        {roles.map((role) => {
                          const entry = perm.roles[role.name];
                          if (!entry?.has) {
  return (
    <TableCell key={role.name} align="center">
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ fontSize: "12px" }}
      >
        {group.module === "daily_tracking" ? "No" : "No"}
      </Typography>
    </TableCell>
  );
}
                          return (
                            <TableCell key={role.name} align="center">
                             <Chip
  label={
    group.module === "daily_tracking"
      ? "Yes"
      : entry.display && entry.display.trim() !== ""
      ? entry.display
      : entry.scope === "ALL"
      ? "Yes"
      : "Assigned Home"
  }
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  backgroundColor:
                                    entry.scope === "ALL"
                                      ? "#E8F5E9"
                                      : "#FFF3E0",
                                  color:
                                    entry.scope === "ALL"
                                      ? "#2E7D32"
                                      : "#E65100",
                                }}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default RolesPermissionsTab;
