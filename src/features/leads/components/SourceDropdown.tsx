import { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const SOURCES = [
  "Family Support Agency",
  "Hospital",
  "Self Referral",
  "Community Partner",
];

const SourceDropdown = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [value, setValue] = useState("Source");

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          width: 180,
          height: 37,
          justifyContent: "space-between",
          border: "1px solid #DEE4ED",
          borderRadius: "4px",
          background: "#FFFFFF",
          textTransform: "none",
          px: "12px",
        }}
      >
        <Typography fontSize={14} color="#344054">
          {value}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            width: 180,
            borderRadius: "4px",
            border: "1px solid #DEE4ED",
            boxShadow:
              "0px 4px 6px -2px #10182808, 0px 12px 16px -4px #10182814",
          },
        }}
      >
        {SOURCES.map((source) => (
          <MenuItem
            key={source}
            onClick={() => {
              setValue(source);
              setAnchorEl(null);
            }}
            sx={{ py: "4px", px: "12px", fontSize: 14 }}
          >
            {source}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default SourceDropdown;
