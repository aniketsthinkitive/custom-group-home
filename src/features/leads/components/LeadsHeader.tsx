import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { Grid, Box, Stack, Typography, Tooltip, type SelectChangeEvent } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CustomSelect from "../../../components/custom-select/custom-select";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../components/custom-label/custom-label";
import { usePermission } from "../../../hooks/usePermission";

interface LeadsHeaderProps {
  onSearch?: (term: string) => void;
  onStatusChange?: (status: string) => void;
  onNewLead?: () => void;
  status?: string; // Add status prop to make it controlled
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "DOCS_PENDING", label: "Docs Pending" },
  { value: "ONBOARDING_IN_PROGRESS", label: "Onboarding In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  UNDER_REVIEW: { bg: "#E8F0FE", color: "#2563EB" },
  COMPLETED: { bg: "#EAF7EE", color: "#16A34A" },
  REJECTED: { bg: "#FDECEC", color: "#DC2626" },
  DRAFT: { bg: "#F1F5F9", color: "#64748B" },
  DOCS_PENDING: { bg: "#FFF4E5", color: "#D97706" },
  ONBOARDING_IN_PROGRESS: { bg: "#F3EDFF", color: "#7C3AED" },
};


const LeadsHeader = ({ onSearch, onStatusChange, onNewLead, status = "" }: LeadsHeaderProps) => {
  const { hasPermission } = usePermission();
  const canCreateLead = hasPermission("leads.create");
  const [searchValue, setSearchValue] = React.useState("");
  // Store latest callback in ref to avoid including it in useEffect dependencies
  const onSearchRef = useRef(onSearch);
  
  // Update ref when callback changes
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  }, []);

  // Debounce search - only depend on searchValue, use ref for callback
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current?.(searchValue);
    }, 300); // fast response

    return () => clearTimeout(timer);
  }, [searchValue]); // Only depend on searchValue

  const handleStatusChange = useCallback((e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    // Directly call parent callback - no local state update needed
    onStatusChange?.(value);
  }, [onStatusChange]);


  const STATUS_SELECT_OPTIONS = useMemo(() => {
    return STATUS_OPTIONS.map((opt) => {
      if (!opt.value) return opt;
      const style = STATUS_STYLES[opt.value] || { bg: "#F1F5F9", color: "#64748B" };
      return {
        ...opt,
        child: (
          <Box
            sx={{
              // Shrink chip to its text — the select wraps options in a
              // full-width Grid, which would otherwise stretch the pill
              // background across the whole menu row
              display: "inline-flex",
              width: "fit-content",
              px: 1.25,
              py: 0.5,
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor: style.bg,
              color: style.color,
              whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </Box>
        ),
      };
    });
  }, []);

  return (
    <Grid
      container
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "12px",
        paddingX: { xs: "16px", sm: "24px", md: "20px" },
        paddingTop: "16px",
        background: "#FFFFFF",
      }}
    >
      <Grid size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}>
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#30353A",
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            whiteSpace: "nowrap",
          }}
        >
          All Leads
        </Typography>
      </Grid>

      <Grid
        container
        size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
          justifyContent: { xs: "flex-start", sm: "flex-start", md: "flex-end", lg: "flex-end" },
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ flexWrap: "wrap", gap: "12px" }}>
          <Box sx={{ minWidth: 240 }}>
            <CustomSelect
              placeholder="All Status"
              name="status"
              value={status}
              items={STATUS_SELECT_OPTIONS}
              onChange={handleStatusChange}
              bgWhite
              height={44}
            />
          </Box>

          <CustomInput
            name="search"
            placeholder="Search by Name/Source"
            value={searchValue}
            onChange={handleSearchChange}
            hasStartSearchIcon
            bgWhite
          />

          <Tooltip
            title={canCreateLead ? "" : "You don't have permission to add leads"}
            arrow
          >
            <span>
              <CustomButton
                variant="primary"
                size="md"
                icon={<AddIcon />}
                iconPosition="left"
                onClick={onNewLead}
                disabled={!canCreateLead}
                sx={{ height: 40 }}
              >
                New Lead
              </CustomButton>
            </span>
          </Tooltip>
        </Stack>
      </Grid>
    </Grid>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(LeadsHeader, (prevProps, nextProps) => {
  // Custom comparison - only re-render if props actually changed
  return (
    prevProps.status === nextProps.status &&
    prevProps.onSearch === nextProps.onSearch &&
    prevProps.onStatusChange === nextProps.onStatusChange &&
    prevProps.onNewLead === nextProps.onNewLead
  );
});
