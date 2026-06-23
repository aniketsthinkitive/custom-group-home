import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomTextArea from "../../../components/custom-text-area/custom-textarea";
import CustomLabel from "../../../components/custom-label/custom-label";
import CustomRadio from "../../../components/custom-radio/custom-radio";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import { SHIFT_OPTIONS, type ShiftOption } from "../utils/carePlanConstants";

interface CarePlanItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, shifts: string[]) => void;
  dialogTitle: string;
  buttonLabel: string;
  initialTitle?: string;
  initialDescription?: string;
  initialShifts?: string[];
  isSubmitting?: boolean;
  itemType: "ADL" | "GOAL";
  shiftOptions?: ShiftOption[];
}

const schema = yup.object({
  title: yup.string().required("Title is required").trim().min(3, "At least 3 characters required").max(100, " Maximum 100 characters allowed"),
  description: yup.string().required("Description is required"),
  shift: yup.string().required("Shift is required"),
});

type FormData = yup.InferType<typeof schema>;

const CarePlanItemDialog = ({
  open,
  onClose,
  onSubmit,
  dialogTitle,
  buttonLabel,
  initialTitle = "",
  initialDescription = "",
  initialShifts = [],
  isSubmitting = false,
  itemType,
  shiftOptions,
}: CarePlanItemDialogProps) => {
  const theme = useTheme();
  const displayShifts = shiftOptions && shiftOptions.length > 0 ? shiftOptions : SHIFT_OPTIONS;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: initialTitle,
      description: initialDescription,
      shift: initialShifts[0] || "",
    },
    mode: "onSubmit",
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        title: initialTitle,
        description: initialDescription,
        shift: initialShifts[0] || "",
      });
    }
  }, [open]);

  const handleClose = () => {
    reset({ title: "", description: "", shift: "" });
    onClose();
  };

  const onFormSubmit = (data: FormData) => {
    onSubmit(
      data.title,
      data.description || "",
      data.shift ? [data.shift] : [],
    );
  };

  const titleLabel = itemType === "ADL" ? "ADL Title" : "Goal Name";

  return (
    <CustomDialog
      title={dialogTitle}
      buttonName={[]}
      open={open}
      onClose={handleClose}
      width={520}
    >
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <CustomLabel label={titleLabel} isRequired />
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <CustomInput
                placeholder="Enter Name"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <CustomLabel label="Description" isRequired />
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <CustomTextArea
                placeholder="Enter description..."
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                minRow={3}
                maxRow={10}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <CustomLabel label="Shift" isRequired />
          <Controller
            name="shift"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Grid container direction="column" sx={{ gap: 0.5, mt: 0.5 }}>
                  {displayShifts.map((s) => (
                    <Grid
                      container
                      key={s.key}
                      alignItems="center"
                      spacing={1}
                    >
                      <Grid>
                        <CustomRadio
                          checked={field.value === s.key}
                          value={s.key}
                          label={s.label}
                          showText
                          onChange={(checked, value) => {
                            if (checked && value) field.onChange(value);
                          }}
                        />
                      </Grid>
                      <Grid>
                        <Typography fontSize={12} color="text.secondary">
                          {s.time}
                        </Typography>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
                {fieldState.error && (
                  <Typography fontSize={12} color="error" sx={{ mt: 0.5 }}>
                    {fieldState.error.message}
                  </Typography>
                )}
              </>
            )}
          />
        </Grid>
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            pt: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CustomButton
            variant="primary"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {buttonLabel}
          </CustomButton>
        </Grid>
      </Grid>
    </CustomDialog>
  );
};

export default CarePlanItemDialog;
