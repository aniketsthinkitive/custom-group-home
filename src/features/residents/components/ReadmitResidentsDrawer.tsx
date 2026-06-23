import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme, useMediaQuery } from "@mui/material";
import { reAdmitLeadMutation } from "../../../sdk/@tanstack/react-query.gen";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import ReAdmitResidentForm from "./ReAdmitResidentForm";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";

type SubmitArgs = {
  assignmentUuid: string;
  payload: {
    check_in_date: string;
    financial_effective_date: string | null;
    room: number;
    group_home_id: number;
    status: string;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  resident: any;
};

const ReAdmitResidentDrawer = ({ open, onClose, resident }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  const getBackendMessage = (data: unknown): string | undefined => {
    const responseData = (data as any)?.data ?? data;
    if (typeof responseData === "string") return responseData;
    if (responseData?.message) return responseData.message;
    if (responseData?.detail) return responseData.detail;
    if (responseData?.data?.message) return responseData.data.message;
    return undefined;
  };

  const { mutate, isLoading, isPending } = useMutation({
    ...reAdmitLeadMutation(),
    onSuccess: async (data: unknown) => {
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const id = (query.queryKey[0] as any)?._id;
          return (
            id === "listResidents" ||
            id === "retrieveGroupHome" ||
            id === "listGroupHomes"
          );
        },
      });

      setSnackbar({
        isOpen: true,
        message: getBackendMessage(data) || "Resident re-admitted successfully",
        status: "success",
      });

      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to re-admit resident";

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.detail) {
          errorMessage = errorData.detail;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: "error",
      });
    },
  });

  // Reset snackbar when drawer transitions from closed → open
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSnackbar({ isOpen: false, message: "", status: "success" });
    }
  }

  const isMutating = isLoading || isPending;
  const isSubmittingRef = useRef(false);

  const handleSubmit = ({ assignmentUuid, payload }: SubmitArgs) => {
    if (isMutating || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    mutate(
      {
        path: { assignment_uuid: assignmentUuid },
        body: payload as any,
      },
      {
        onSettled: () => {
          isSubmittingRef.current = false;
        },
      }
    );
  };

  if (!resident) return null;

  return (
    <>
      <CustomDrawer
        anchor="right"
        open={open}
        onClose={onClose}
        title="Re-admit Resident"
        drawerWidth={isMobile ? "100%" : isTablet ? "500px" : "640px"}
        drawermargin={isMobile ? "0" : undefined}
        drawerPadding={isMobile ? "16px" : "24px"}
      >
        <ReAdmitResidentForm
          resident={resident}
          onClose={onClose}
          onSubmit={handleSubmit}
          isLoading={isMutating}
        />
      </CustomDrawer>

      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </>
  );
};

export default ReAdmitResidentDrawer;
