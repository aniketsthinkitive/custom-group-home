import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme, useMediaQuery } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import CommonNavbar from '../components/nav-bar/CommonNavbar';
import {
  PersonSearch as PersonSearchIcon,
  People as PeopleIcon,
  DescriptionOutlined as DescriptionIcon,
  ErrorOutline as ErrorOutlineIcon,
  AssignmentTurnedInOutlined as AssignmentTurnedInIcon,
  CalendarToday as CalendarTodayIcon,
  SettingsOutlined as SettingsIcon,
} from '@mui/icons-material';
import { usePermission } from '../hooks/usePermission';
import { getUserRoleType } from '../utils/auth';

interface ProtectedLayoutProps {
  children?: React.ReactNode;
}

const DRAWER_WIDTH = 280;

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  // Show hamburger menu for screens < 1280px
  // For screens >= 1280px, show persistent sidebar
  const isMediumScreen = useMediaQuery('(max-width: 1279px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleType = getUserRoleType();
  const { canAccess, hasPermission } = usePermission();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActiveRoute = (path: string) => {
    if (path === '/admin/settings' && location.pathname.startsWith('/admin/user-details')) {
      return true;
    }
    // Avoid double-highlighting Incidents when on the PM Review Queue sub-route.
    if (
      path === '/admin/incidents' &&
      location.pathname.startsWith('/admin/incidents/review-queue')
    ) {
      return false;
    }
    return location.pathname.startsWith(path);
  };

  // Navigation items filtered by permissions
  const navItems = React.useMemo(() => {
    if (roleType !== 'ADMIN' && roleType !== 'STAFF') return [];

    const allItems: Array<{
      label: string;
      path: string;
      icon: React.ReactNode;
      modules: string[];
      /** Optional specific permission key — when present, this item is ALSO gated by it. */
      requirePermission?: string;
    }> = [
      {
        label: 'Leads',
        path: '/admin/leads',
        icon: <PersonSearchIcon />,
        modules: ['leads'],
      },
      {
        label: 'Residents',
        path: '/admin/residents',
        icon: <PeopleIcon />,
        modules: ['onboarding', 'documents', 'consent_forms', 'adls', 'goals', 'monthly_summary'],
      },
      {
        label: 'Daily Logs',
        path: '/admin/daily-logs',
        icon: <DescriptionIcon />,
        modules: ['daily_tracking'],
      },
      {
        label: 'Incidents',
        path: '/admin/incidents',
        icon: <ErrorOutlineIcon />,
        modules: ['incidents'],
      },
      // {
      //   label: 'PM Review Queue',
      //   path: '/admin/incidents/review-queue',
      //   icon: <AssignmentTurnedInIcon />,
      //   modules: ['incidents'],
      //   requirePermission: 'incidents.pm_review',
      // },
      {
        label: 'Appointments',
        path: '/admin/appointment',
        icon: <CalendarTodayIcon />,
        modules: ['appointments'],
      },
      {
        label: 'Settings',
        path: '/admin/settings',
        icon: <SettingsIcon />,
        modules: ['users', 'group_homes', 'audit_logs'],
      },
    ];

    return allItems.filter((item) => {
      const moduleAccess = item.modules.some((mod) => canAccess(mod));
      if (!moduleAccess) return false;
      if (item.requirePermission && !hasPermission(item.requirePermission)) {
        return false;
      }
      return true;
    });
  }, [roleType, canAccess, hasPermission]);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMediumScreen) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box
      data-testid="sidebar"
      sx={{
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E3ECEF',
      }}
    >
      <List sx={{ pt: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActiveRoute(item.path)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: '8px',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(30, 58, 95, 0.1)',
                  color: '#1E3A5F',
                  '&:hover': {
                    backgroundColor: 'rgba(30, 58, 95, 0.15)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#1E3A5F',
                  },
                },
                '&:hover': {
                  backgroundColor: '#F5F5F5',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActiveRoute(item.path) ? '#1E3A5F' : 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '15px',
                  fontWeight: isActiveRoute(item.path) ? 500 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navbar at the top */}
      <CommonNavbar onDrawerToggle={handleDrawerToggle} />
      
      {/* Drawer for navigation - ONLY visible when hamburger menu is showing (screens < 1280px) */}
      {isMediumScreen && (
        <Box
          component="nav"
          sx={{ 
            width: 0, 
            flexShrink: 0 
          }}
        >
          {/* Temporary drawer for screens < 1280px (when hamburger menu is visible) */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                mt: '64px', // Account for navbar height
                height: 'calc(100vh - 64px)',
              },
            }}
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px', // Height of navbar
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f5f5f5',
          width: '100%', // Always full width since sidebar is only temporary
        }}
      >
        {children || <Outlet />}
      </Box>
    </Box>
  );
};

export default ProtectedLayout;
