import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { listUsers } from "../../sdk/sdk.gen";
import { createAssignment } from "./api";

const ROLES = [
  "DSP",
  "PROGRAM_MANAGER",
  "PROGRAM_COORDINATOR",
  "BCBA",
  "NURSE",
  "LEAD",
];

type UserOption = {
  uuid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

/**
 * Best-effort extraction of a user array from the various envelope shapes
 * the backend can return (`{data: {results: []}}`, `{data: []}`, `{results: []}`, `[]`).
 */
function extractUsers(payload: unknown): UserOption[] {
  if (!payload) return [];
  const p = payload as Record<string, unknown>;
  const candidates: unknown[] = [
    (p.data as Record<string, unknown> | undefined)?.results,
    p.data,
    p.results,
    payload,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as UserOption[];
  }
  return [];
}

export default function AssignStaffModal({
  open,
  onClose,
  onAssigned,
  homeUuid,
}: {
  open: boolean;
  onClose(): void;
  onAssigned(): void;
  homeUuid: string;
}) {
  const [userUuid, setUserUuid] = useState("");
  const [roleType, setRoleType] = useState("DSP");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Pull a large page so the dropdown is fully populated. Mirrors
        // the size=1000 pattern used elsewhere for select inputs.
        const { data } = await listUsers({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          query: { page: 1, size: 1000 } as any,
        });
        if (!cancelled) setUsers(extractUsers(data));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load users", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function submit() {
    if (!userUuid) return;
    setSubmitting(true);
    try {
      await createAssignment(homeUuid, userUuid, roleType);
      onAssigned();
      setUserUuid("");
      setRoleType("DSP");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to create assignment", e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Staff</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            select
            label="User"
            value={userUuid}
            onChange={(e) => setUserUuid(e.target.value)}
            fullWidth
            disabled={loading}
          >
            {users.map((u) => (
              <MenuItem key={u.uuid} value={u.uuid}>
                {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                  u.email ||
                  u.uuid}
                {u.email ? ` — ${u.email}` : ""}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Role"
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
            fullWidth
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={!userUuid || submitting}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
