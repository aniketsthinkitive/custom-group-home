import { Grid, Typography, IconButton } from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CustomInput from "../../../components/custom-input/custom-input";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
};

const MovedOutResidentsHeader = ({
  search,
  onSearchChange,
  onClose,
}: Props) => {
  return (
    <Grid
      container
      alignItems="center"
      columnSpacing={2}
      rowSpacing={{ xs: 2, sm: 0 }}
      sx={{
        px: 2,
        py: { xs: 2, sm: 1 },
        margin: "0px",
        minHeight: "56px",
        height: "auto",
        backgroundColor: "white",
        borderBottom: "1px solid #e2e4e8",
        display: "flex",
      }}
    >
      {/* TITLE */}
      <Grid size={{ xs: 10, sm: 4 }}>
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 600,
            color: "#111827",
            whiteSpace: "nowrap",
          }}
        >
          Moved Out Residents
        </Typography>
      </Grid>

      {/* SEARCH */}
      <Grid
        size={{ xs: 12, sm: 7 }}
        display="flex"
        justifyContent={{ xs: "flex-start", sm: "flex-end" }}
        sx={{
          height: "35px",
          minHeight: "35px",
          order: { xs: 3, sm: 2 },
          "& > div": {
             width: { xs: "100%", sm: "auto" }
          }
        }}
      >
        <CustomInput
          name="search"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          hasStartSearchIcon
        />
      </Grid>

      {/* CLOSE */}
      <Grid 
        size={{ xs: 2, sm: 1 }} 
        display="flex" 
        justifyContent="flex-end"
        sx={{
          order: { xs: 2, sm: 3 }
        }}
      >
        <IconButton size="small" onClick={onClose} sx={{ mt: { xs: -1, sm: 0 } }}>
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default MovedOutResidentsHeader;
