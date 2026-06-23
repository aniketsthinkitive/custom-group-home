import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import * as React from "react";
import { TextField, Typography } from "@mui/material";
import theme from "../../constant/styles/theme";
import { customSelectStyles, selectInputStyle } from "../custom-select/widgets/custom-select-widgets";

const ITEM_HEIGHT = 40;
const ITEM_PADDING_TOP = 10;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

type CustomMultiSelectProps = {
  options: { key: string; value: string }[];
  value: string[];
  onChange: (selectedValues: string[]) => void;
  bgWhite?: boolean;
  placeholder: string;
  enableSearch?:boolean;
  menuProps?: any;
};

const CustomMultiSelect = (props: CustomMultiSelectProps) => {
  /*Origin Code before adding search functionality as optional*/

  // const { options, value, onChange, bgWhite, placeholder } = props;

  // const optionKeys = options?.map((opt) => opt.key).filter((opt) => opt) || [];
  // const optionValues =
  //   options?.map((opt) => opt.value).filter((opt) => opt) || [];
  // const preSelectedCleanValues = value
  //   .filter((val) => optionKeys.includes(val))
  //   .map((val) => options.find((opt) => opt.key === val)?.value || "")
  //   .filter((val) => val);
  // const [selectedOptions, setSelectedOptions] = React.useState<string[]>(
  //   preSelectedCleanValues,
  // );

  // const areArraysSame = (arr1: string[], arr2: string[]) => {
  //   const filteredArr1 = arr1.filter((item) => !arr2.includes(item));
  //   const filteredArr2 = arr2.filter((item) => !arr1.includes(item));

  //   return filteredArr1.length === 0 && filteredArr2.length === 0;
  // };

  // React.useEffect(() => {
  //   if (!areArraysSame(selectedOptions, preSelectedCleanValues)) {
  //     setSelectedOptions(preSelectedCleanValues);
  //   }
  // }, [preSelectedCleanValues, selectedOptions]);

  // const handleChange = (event: SelectChangeEvent<string[]>) => {
  //   const {
  //     target: { value },
  //   } = event;

  //   const selectedValArr = value as string[];
  //   setSelectedOptions(selectedValArr);
  //   onChange(
  //     selectedValArr
  //       .map((value) => options.find((opt) => opt.value === value)?.key || "")
  //       .filter((val) => val),
  //   );
  // };

  const { options, value, onChange, bgWhite, placeholder, enableSearch, menuProps } = props;

  const selectRef = React.useRef<HTMLDivElement>(null);
  const [isInsideDrawer, setIsInsideDrawer] = React.useState(false);

  React.useEffect(() => {
    if (selectRef.current) {
      setIsInsideDrawer(selectRef.current.closest('.MuiDrawer-root') !== null);
    }
  }, []);

  const mergedMenuProps = React.useMemo(() => ({
    ...MenuProps,
    ...(isInsideDrawer && { sx: { zIndex: 1500 } }),
    ...menuProps,
  }), [isInsideDrawer, menuProps]);

  const optionKeys = options?.map((opt) => opt.key) || [];
  const optionValues = options?.map((opt) => opt.value) || [];
  const preSelectedCleanValues = value
    .filter((val) => optionKeys.includes(val))
    .map((val) => options.find((opt) => opt.key === val)?.value || "")
    .filter((val) => val);
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>(
    preSelectedCleanValues,
  );
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredOptions = optionValues.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const areArraysSame = (arr1: string[], arr2: string[]) => {
    const filteredArr1 = arr1.filter((item) => !arr2.includes(item));
    const filteredArr2 = arr2.filter((item) => !arr1.includes(item));
    return filteredArr1.length === 0 && filteredArr2.length === 0;
  };

  React.useEffect(() => {
    if (!areArraysSame(selectedOptions, preSelectedCleanValues)) {
      setSelectedOptions(preSelectedCleanValues);
    }
  }, [preSelectedCleanValues, selectedOptions]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;

    const selectedValArr = value as string[];
    setSelectedOptions(selectedValArr);
    onChange(
      selectedValArr
        .map((value) => options.find((opt) => opt.value === value)?.key || "")
        .filter((val) => val),
    );
  };

  return (
    <div>
      
      {/*
       
         {Origin Code before adding search functionality as optional}


      <Select
        sx={{
          ...selectInputStyle,
          backgroundColor: bgWhite === true ? "inherit" : "white",
        }}
        multiple
        size="small"
        displayEmpty
        value={selectedOptions}
        onChange={handleChange}
        input={<OutlinedInput />}
        renderValue={(selected) => (
          <Typography
            variant="buttonLinkAndField3"
            className={`${customSelectStyles.headerLabel}`}
            sx={{
              color:
                selected.length > 0
                  ? theme.palette.grey[800]
                  : theme.palette.grey[500],
            }}
          >
            {selected.join(", ") || placeholder}
          </Typography>
        )}
        MenuProps={MenuProps}
      >
        {optionValues.map((optVal) => (
          <MenuItem key={optVal} value={optVal} sx={{ padding: 0 }}>
            <Checkbox checked={selectedOptions.indexOf(optVal) > -1} />
            <ListItemText primary={optVal} />
          </MenuItem>
        ))}
      </Select> */}


      <Select
        ref={selectRef}
        sx={{
          ...selectInputStyle,
          backgroundColor: bgWhite === true ? "inherit" : "white",
        }}
        multiple
        size="small"
        displayEmpty
        value={selectedOptions}
        onChange={handleChange}
        input={<OutlinedInput />}
        renderValue={(selected) => (
          <Typography
            variant="buttonLinkAndField3"
            className={`${customSelectStyles.headerLabel}`}
            sx={{
              color:
                selected.length > 0
                  ? theme.palette.grey[800]
                  : theme.palette.grey[500],
            }}
          >
            {selected.join(", ") || placeholder}
          </Typography>
        )}
        MenuProps={mergedMenuProps}
      >
        {enableSearch && (
          <MenuItem disableRipple>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus  // Ensures the focus stays in the search field
              onKeyDown={(e) => e.stopPropagation()} 
            />
          </MenuItem>
        )}
        {filteredOptions.length > 0 ? (
          filteredOptions.map((optVal) => (
            <MenuItem key={optVal} value={optVal} sx={{ padding: 0 }}>
              <Checkbox checked={selectedOptions.indexOf(optVal) > -1} />
              <ListItemText primary={optVal} />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No results found</MenuItem>
        )}
      </Select>
    </div>
  );
};

/*newly implimented*/

// const CustomMultiSelect = (props: CustomMultiSelectProps) => {
//   const { options, value, onChange, bgWhite, placeholder, enableSearch } = props;

//   const optionKeys = options.map((opt) => opt.key);
//   const optionValues = options.map((opt) => opt.value);
//   const preSelectedCleanValues = value
//     .filter((val) => optionKeys.includes(val))
//     .map((val) => options.find((opt) => opt.key === val)?.value || "");

//   const [selectedOptions, setSelectedOptions] = React.useState<string[]>(preSelectedCleanValues);
//   const [searchTerm, setSearchTerm] = React.useState(""); // State for search term
//   const [filteredOptions, setFilteredOptions] = React.useState(optionValues);

//   useEffect(() => {
//     setFilteredOptions(
//       optionValues.filter((opt) =>
//         opt.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     );
//     // console.log('serch input', searchTerm);
//   }, [searchTerm]);

//   useEffect(() => {
//     setSelectedOptions(preSelectedCleanValues);
//     // console.log('cewheue second useeffect');
//   }, [preSelectedCleanValues]);

//   const handleChange = (event: SelectChangeEvent<string[]>) => {
//     const selectedValArr = event.target.value as string[];
//     setSelectedOptions(selectedValArr);
//     onChange(
//       selectedValArr
//         .map((value) => options.find((opt) => opt.value === value)?.key || "")
//         .filter((val) => val)
//     );
//   };

//   return (
//     <div>
//       <Select
//         sx={{
//           ...selectInputStyle,
//           backgroundColor: bgWhite === true ? "inherit" : "white",
//         }}
//         multiple
//         size="small"
//         displayEmpty
//         value={selectedOptions}
//         onChange={handleChange}
//         input={<OutlinedInput />}
//         renderValue={(selected) => (
//           <Typography
//             variant="buttonLinkAndField3"
//             className={customSelectStyles.headerLabel}
//             sx={{
//               color: selected.length > 0
//                 ? theme.palette.grey[800]
//                 : theme.palette.grey[500],
//             }}
//           >
//             {selected.join(", ") || placeholder}
//           </Typography>
//         )}
//         MenuProps={MenuProps}
//       >
//         {/* Search Input Field */}
//         {enableSearch && (
//           <MenuItem disableRipple>
//             <TextField
//               size="small"
//               fullWidth
//               variant="outlined"
//               placeholder="Search..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               // sx={{ marginBottom: 1 }}
//               sx={{
//                 backgroundColor: "white",
//                 color: theme.palette.grey[900], // Ensures text is visible
//                 "& .MuiInputBase-input": {
//                   padding: "8px",
//                   fontSize: "14px",
//                   color: theme.palette.grey[900], // Text color
//                 },
//               }}
//             />
//           </MenuItem>
//         )}

//         {filteredOptions.length > 0 ? (
//           filteredOptions.map((optVal) => (
//             <MenuItem key={optVal} value={optVal} sx={{ padding: 0 }}>
//               <Checkbox checked={selectedOptions.includes(optVal)} />
//               <ListItemText primary={optVal} />
//             </MenuItem>
//           ))
//         ) : (
//           <MenuItem disabled>No options found</MenuItem>
//         )}
//       </Select>
//     </div>
//   );
// };


export default CustomMultiSelect;
