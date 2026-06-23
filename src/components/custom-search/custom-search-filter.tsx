import { Grid } from "@mui/material";
import * as React from "react";
import { useState } from "react";
// import { SEARCH } from "../../constant/constants";
import CustomInput from "../custom-input/custom-input";
import {
  btnContainer,
  // btnStyle,
  filterSearchBox,
} from "./widgets/custom-search-styles";

interface SearchFilterProps {
  textData: {
    placeholder: string;
    btnTitle: string;
  };
  onSearch?: (value: string) => void;
  width?: string;
  hasStartSearchIcon?: boolean;
  startSearchIconOnRight?: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = (props) => {
  const [inputValue, setInputValue] = useState("");

  // const handleSearch = () => {
  //   props.onSearch && props.onSearch(inputValue);
  // };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e?.target?.value || "");
  };

  return (
    <>
      <Grid>
        <Grid container sx={btnContainer}>
          <Grid sx={filterSearchBox}>
            <Grid width={props.width ? props.width : "13rem"}>
              <CustomInput
                name="search"
                placeholder={props.textData.placeholder}
                onChange={handleInputChange}
                value={inputValue}
                bgWhite
                hasStartSearchIcon={props.hasStartSearchIcon}
                startSearchIconOnRight={props.startSearchIconOnRight}
              />
            </Grid>
            {/* <Grid>
              <Button
                variant={"contained"}
                onClick={handleSearch}
                sx={{ ...btnStyle }}
              >
                {SEARCH}
              </Button>
            </Grid> */}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default SearchFilter;
