import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Route Components
import UnprotectedRoute from "./UnprotectedRoute";
import ProtectedRoute from "./ProtectedRoute";
import ProtectedLayout from "./ProtectedLayout";
import RoleBasedRoute, { ADMIN_PANEL_ROLES, PORTAL_ROLES } from "./RoleBasedRoute";

// Auth Pages
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ForgotPassword } from "../features/auth/pages/ForgotPassword";
import { VerifyOtpPage } from "../features/auth/pages/VerifyOtpPage";
import { ResetPassword } from "../features/auth/pages/Reset-Password";

// Feature Pages
import DashboardPage from "../features/admin/pages/DashboardPage";
import GroupHomesSettingsPage from "../features/settings/pages/GroupHomesSettingsPage";
import Residentdetailspage from "../features/residents/pages/Residentdetailspage";
import ResidentProfilePage from "../features/residents/pages/ResidentProfilePage";

import LeadsListPage from "../features/leads/pages/LeadsListPage";
import LeadDetailPage from "../features/leads/pages/LeadDetailPage";
import IncidentsPage from "../features/incidents/pages/IncidentsPage";
import PMReviewQueue from "../features/incidents/pages/PMReviewQueue";
import GroupHomeDetailsPage from "../features/settings/pages/GroupHomeDetailsPage";

import DailyLogsPage from "../features/daily_logs/pages/DailyLogsPage";
import UserDetailsPage, { UserDetailsProfilePage } from "../features/userDetails/Page/userDetailsPage";
import AppointmentsPage from "../features/appointments/pages/AppointmentsPage";
import PortalDashboardPage from "../features/portal/pages/PortalDashboardPage";
import PortalAppointmentsPage from "../features/guardian/appointments/pages/PortalAppointmentsPage";
import ResidentUpcomingAppointmentsPage from "../features/guardian/appointments/pages/ResidentUpcomingAppointmentsPage";
import GuardianProfilePage from "../features/guardian/appointments/pages/GuardianProfilePage";
import IncidentDetailsPage from "../features/guardian/incidents/pages/IncidentDetailsPage";
import CarePlanPage from "../features/guardian/careplan/pages/CarePlanPage";
import CarePlanResidentProfilePage from "../features/guardian/careplan/pages/CarePlanResidentProfilePage";
import PortalResidentProfilePage from "../features/guardian/incidents/pages/PortalResidentProfilePage";
import AllDocumentListPage from "../features/guardian/Documents/pages/AllDocumentListPage";
import ResidentDocumentPage from "../features/guardian/Documents/pages/ResidentDocumentPage";

// Layouts
import PortalLayout from "./PortalLayout";
import RoleBasedRedirect from "./RoleBasedRedirect";
import InitialAuthRedirect from "./InitialAuthRedirect";
import PermissionRoute from "./PermissionRoute";
import AdminDefaultRedirect from "./AdminDefaultRedirect";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root: wait for auth check (including refresh) then redirect to login or main */}
      <Route path="/" element={<InitialAuthRedirect />} />

      {/* ============================================ */}
      {/* Unprotected Routes (Public) */}
      {/* ============================================ */}

      {/* Authentication Routes */}
      <Route
        path="login"
        element={
          <UnprotectedRoute>
            <LoginPage />
          </UnprotectedRoute>
        }
      />
      
      <Route
        path="forgot-password"
        element={
          <UnprotectedRoute>
            <ForgotPassword />
          </UnprotectedRoute>
        }
      />

      <Route
        path="verify-otp"
        element={
          <UnprotectedRoute>
            <VerifyOtpPage />
          </UnprotectedRoute>
        }
      />

      <Route
        path="set-password"
        element={
          <UnprotectedRoute>
            <ResetPassword />
          </UnprotectedRoute>
        }
      />

      <Route
        path="reset-password"
        element={
          <UnprotectedRoute>
            <ResetPassword />
          </UnprotectedRoute>
        }
      />

      {/* ============================================ */}
      {/* Admin Routes (Nested) - For ADMIN and STAFF */}
      {/* ============================================ */}

      <Route
        path="admin"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={ADMIN_PANEL_ROLES}>
              <ProtectedLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        {/* Default admin route - redirect to first accessible page */}
        <Route index element={<AdminDefaultRedirect />} />

        {/* Dashboard */}
        {/* <Route path="dashboard" element={<DashboardPage />} /> */}

        {/* Leads Page */}
        <Route path="leads" element={
          <PermissionRoute modules={['leads']}>
            <LeadsListPage />
          </PermissionRoute>
        } />
        <Route path="leads/:uuid" element={
          <PermissionRoute modules={['leads']}>
            <LeadDetailPage />
          </PermissionRoute>
        } />

        {/* Residents Page */}
        <Route path="residents" element={
          <PermissionRoute modules={['onboarding', 'documents', 'consent_forms', 'adls', 'goals', 'monthly_summary']}>
            <Residentdetailspage />
          </PermissionRoute>
        } />
        <Route path="residents/:residentId" element={
          <PermissionRoute modules={['onboarding', 'documents', 'consent_forms', 'adls', 'goals', 'monthly_summary']}>
            <ResidentProfilePage />
          </PermissionRoute>
        } />

        {/* Incidents */}
        <Route path="incidents" element={
          <PermissionRoute modules={['incidents']}>
            <IncidentsPage />
          </PermissionRoute>
        } />
        {/* <Route path="incidents/review-queue" element={
          <PermissionRoute modules={['incidents']}>
            <PMReviewQueue />
          </PermissionRoute>
        } /> */}

        {/* Own profile: always accessible (no permission check needed) */}
        <Route path="profile" element={<UserDetailsProfilePage />} />
        {/* View any user */}
        <Route path="user-details/:id" element={
          <PermissionRoute modules={['users']}>
            <UserDetailsPage />
          </PermissionRoute>
        } />

        {/* Daily Logs */}
        <Route path="daily-logs" element={
          <PermissionRoute modules={['daily_tracking']}>
            <DailyLogsPage />
          </PermissionRoute>
        } />

        {/* Appointments */}
        <Route path="appointment" element={
          <PermissionRoute modules={['appointments']}>
            <AppointmentsPage />
          </PermissionRoute>
        } />

        {/* Settings */}
        <Route path="settings" element={
          <PermissionRoute modules={['users', 'group_homes', 'audit_logs']}>
            <GroupHomesSettingsPage />
          </PermissionRoute>
        } />
        <Route path="settings/group-homes/:uuid" element={
          <PermissionRoute modules={['group_homes']}>
            <GroupHomeDetailsPage />
          </PermissionRoute>
        } />
      </Route>
      {/* <Route path ="UserDetailsPage" element={<UserDetailsPage />} /> */}
      

      {/* ============================================ */}
      {/* Portal Routes (Nested) - For GUARDIAN and AGENT */}
      {/* ============================================ */}

      <Route
        path="portal"
        element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={PORTAL_ROLES}>
              <PortalLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        {/* Default portal route - redirect to careplan */}
        <Route index element={<Navigate to="/portal/careplan" replace />} />

        {/* Portal Care Plan Page */}
        <Route path="careplan" element={<CarePlanPage />} />
        {/* ✅ Care Plan Profile (WITH TABS) */}
       <Route path="care-plan/:residentId" element={<CarePlanResidentProfilePage />}/>

        {/* Portal Incidents Page */}
        <Route path="incidents" element={<IncidentDetailsPage />} />
        <Route path="incidents/:residentId" element={<PortalResidentProfilePage />} />

        {/* Portal Appointments - placeholder for now */}
        <Route path="appointments" element={<PortalAppointmentsPage/>} />
        <Route path="appointments/resident/:residentId/upcoming" element={<ResidentUpcomingAppointmentsPage/>} />

        {/* Portal Appointments - placeholder for now */}
        <Route path="documents" element={<AllDocumentListPage/>} />
        <Route path="documents/:residentId" element={<ResidentDocumentPage/>} />
        <Route path="profile" element={<UserDetailsProfilePage />} />
      </Route>

      {/* ============================================ */}
      {/* Role-based redirect for authenticated users */}
      {/* ============================================ */}
      <Route
        path="home"
        element={
          <ProtectedRoute>
            <RoleBasedRedirect />
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      
    </Routes>
  );
};

export default AppRoutes;
