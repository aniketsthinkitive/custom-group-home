import { Grid, Typography, Box } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomSelect from "../../../components/custom-select/custom-select";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

type Option = {
  value: string;
  label: string;
};

type ResidentsHeaderProps = {
  total: number;
  status: string;
  groupHome: string;
  search: string;
  groupHomeItems: Option[];
  groupHomeLoading: boolean;
  groupHomeDisabled?: boolean;
  onStatusChange: (value: string) => void;
  onGroupHomeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onViewMovedOut: () => void;
};

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Moved Out", value: "MOVED_OUT" },
];

const ResidentsHeader = ({
  total,
  status,
  groupHome,
  search,
  groupHomeItems,
  groupHomeLoading,
  groupHomeDisabled = false,
  onStatusChange,
  onGroupHomeChange,
  onSearchChange,
  onViewMovedOut,
}: ResidentsHeaderProps) => {
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
      }}
    >
      {/* Title - same line as controls, same style as Daily Logs */}
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
          Residents
        </Typography>
      </Grid>

      {/* Controls - same line, proper spacing as Daily Logs */}
      <Grid
        container
        size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: "12px", sm: "12px", md: "12px", lg: "12px" },
          flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
          justifyContent: { xs: "flex-start", sm: "flex-start", md: "flex-end", lg: "flex-end" },
        }}
      >
        <Grid size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }} sx={{ flexShrink: 0 }}>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#0B5ED7",
              cursor: "pointer",
              whiteSpace: "nowrap",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={onViewMovedOut}
          >
            View Moved Out residents
          </Typography>
        </Grid>

        <Grid
          size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
          sx={{
            width: { xs: "100%", sm: "160px", md: "160px", lg: "160px" },
            minWidth: { sm: "160px", md: "160px", lg: "160px" },
            flexShrink: 0,
          }}
        >
          <Box
            onClick={() => {
              const next = status === "ACTIVE" ? "MOVED_OUT" : "ACTIVE";
              onStatusChange(next);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "44px",
              width: "100%",
              border: "1px solid",
              borderColor: "grey.400",
              borderRadius: "6px",
              backgroundColor: "white",
              px: "12px",
              cursor: "pointer",
              userSelect: "none",
              "&:hover": {
                borderColor: "grey.400",
              },
            }}
          >
            <Typography
              sx={{
                color: "#2C2D2C",
                fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "1.5",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Active"}
            </Typography>
            <KeyboardArrowRightOutlinedIcon sx={{ color: "rgba(0, 0, 0, 0.54)", fontSize: "24px", ml: 0.5 }} />
          </Box>
        </Grid>

        <Grid
          size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
          sx={{
            width: { xs: "100%", sm: "220px", md: "260px", lg: "260px" },
            minWidth: { sm: "220px", md: "240px", lg: "260px" },
            flexShrink: 0,
          }}
        >
          <CustomSelect
            name="group_home"
            placeholder="All Group Home"
            items={groupHomeItems.map(item => ({
              value: item.value,
              label: item.label,
              child: (
                <Typography
                  fontSize={14}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                    maxWidth: "100%",
                  }}
                >
                  {item.label}
                </Typography>
              ),
            }))}
            value={groupHome}
            isDisabled={groupHomeLoading || groupHomeDisabled}
            onChange={(e) => onGroupHomeChange(e.target.value)}
            bgWhite
          />
        </Grid>

        <Grid
          size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
          sx={{ minWidth: { md: "250px", lg: "250px" }, flexShrink: 1 }}
        >
          <CustomInput
            name="search"
            placeholder="Search by Resident Name"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            hasStartSearchIcon
            bgWhite
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ResidentsHeader;
