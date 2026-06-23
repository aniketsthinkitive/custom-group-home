import React, { useState } from "react";
import { Box, Paper, Tooltip } from "@mui/material";
import TabsAndButton from "../components/TabsAndButton";
import UsersTableWithPagination from "../components/UsersTableWithPagination";
import AddNewUserDrawer from "../components/AddNewUserDrawer";
import type { UserFormData } from "../components/AddNewUserForm";
import type { UserData } from "../components/UsersTable";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import { formatPhone } from "../../../utils";
import { usePermission } from "../../../hooks/usePermission";

const UsersSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("users");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editUserData, setEditUserData] = useState<UserData | null>(null);
  const { hasPermission } = usePermission();
  const canCreateUser = hasPermission("users.create");
  const canEditUser = hasPermission("users.edit");
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    status: 'success',
  });

  const handleToggleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: string | null
  ) => {
    if (newValue !== null) {
      setActiveTab(newValue);
    }
  };

  const handleAddNewUser = () => {
    setIsEditMode(false);
    setEditUserData(null);
    setIsDrawerOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    if (!canEditUser) return; // Guard: no-op if no permission
    setIsEditMode(true);
    setEditUserData(user);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setIsEditMode(false);
    setEditUserData(null);
  };

  const handleSubmitUser = (data: UserFormData) => {
    // Handle user submission if needed
    // console.log("User submitted:", data);
  };

  const handleUserSuccess = (message: string) => {
    setSnackbar({
      isOpen: true,
      message,
      status: 'success',
    });
  };

  const handleUserError = (message: string) => {
    setSnackbar({
      isOpen: true,
      message,
      status: 'error',
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, isOpen: false }));
  };

  const tabs = [
    { value: "group-homes", label: "All Group Home", disabled: true },
    { value: "users", label: "All Users" },
  ];

  // Transform UserData to UserFormData format
  const transformUserDataToFormData = (user: UserData): Partial<UserFormData> => {
    // Extract group home ID or UUID from object or use existing string value
    // Note: Must match the dropdown format which uses String(home.id || home.uuid)
    let groupHomeValue: string | string[] = '';
    
    if ((user as any).group_homes && Array.isArray((user as any).group_homes) && (user as any).group_homes.length > 0) {
      groupHomeValue = (user as any).group_homes.map((gh: any) => gh.uuid || String(gh.id || gh.value || ''));
    } else if (user.groupHome && typeof user.groupHome === 'string' && user.groupHome !== '-') {
      // If it's already a string (ID or UUID), use it
      groupHomeValue = user.groupHome;
    } else if ((user as any).group_home) {
      const groupHome = (user as any).group_home;
      if (typeof groupHome === 'object' && groupHome !== null) {
        // Extract ID first (to match dropdown format), then UUID as fallback
        groupHomeValue = groupHome.id ? String(groupHome.id) : (groupHome.uuid || '');
      } else if (typeof groupHome === 'string') {
        groupHomeValue = groupHome;
      }
    }
    
    return {
      uuid: user.uuid,
      username: user.username,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone ? formatPhone(user.phone) : '',
      role: user.role?.name || user.role?.type || user.role?.uuid || '',
      groupHome: groupHomeValue,
      active: user.active,
      profilePicture: (user as any).avatar_url || (user as any).profile_picture || null,
      isPasswordSet: !!user.isPasswordSet,
    };
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: { xs: "100vh", sm: "93vh" },
        backgroundColor: "#F6F6F6",
        padding: { xs: "12px", sm: "20px" },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRadius: "8px",
          border: "1px solid #E7E9EB",
          backgroundColor: "#FFFFFF",
          padding: "16px",
        }}
      >
        <TabsAndButton
          activeTab={activeTab}
          onTabChange={handleToggleChange}
          tabs={tabs}
          buttonLabel="+ Add New User"
          onButtonClick={canCreateUser ? handleAddNewUser : undefined}
          buttonDisabled={!canCreateUser}
          buttonTooltip={canCreateUser ? undefined : "You don't have permission to add users"}
        />

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <UsersTableWithPagination onEdit={handleEditUser} />
        </Box>
      </Paper>

      <AddNewUserDrawer
        open={isDrawerOpen}
        isEdit={isEditMode}
        initialData={editUserData ? transformUserDataToFormData(editUserData) : undefined}
        onClose={handleCloseDrawer}
        onSubmit={handleSubmitUser}
        onSuccess={handleUserSuccess}
        onError={handleUserError}
        isPasswordSet={!!editUserData?.isPasswordSet}
      />

      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={handleSnackbarClose}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </Box>
  );
};

export default UsersSettingsPage;
