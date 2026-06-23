import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useMediaQuery } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import PortalNavbar from '../components/nav-bar/PortalNavbar';
import {
  Assignment as AssignmentIcon,
  ErrorOutline as ErrorOutlineIcon,
  CalendarToday as CalendarTodayIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';

interface PortalLayoutProps {
  children?: React.ReactNode;
}

const DRAWER_WIDTH = 280;

const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
  // Show hamburger menu for screens < 1280px
  // For screens >= 1280px, navigation links will be shown in navbar
  const isMediumScreen = useMediaQuery('(max-width: 1279px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActiveRoute = (path: string) => {
    // Special handling for Care Plan to match both /portal/careplan and /portal/care-plan routes
    if (path === '/portal/careplan') {
      return location.pathname.startsWith('/portal/careplan') || location.pathname.startsWith('/portal/care-plan');
    }
    return location.pathname.startsWith(path);
  };

  // Navigation items for Guardian/Agent Portal
  const navItems = [
    { 
      label: 'Care Plan', 
      path: '/portal/careplan', 
      icon: <AssignmentIcon />, 
    },
    { 
      label: 'Incidents',
      path: '/portal/incidents', 
      icon: <ErrorOutlineIcon />, 
    },
    { 
      label: 'Appointments',
      path: '/portal/appointments', 
      icon: <CalendarTodayIcon />, 
    },
    { 
      label: 'Documents', 
      path: '/portal/documents', 
      icon: <FolderIcon />, 
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMediumScreen) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box
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
                    color: '#1976d2',
                  },
                },
                '&:hover': {
                  backgroundColor: '#F5F5F5',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActiveRoute(item.path) ? '#1976d2' : 'inherit',
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
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Navbar at the top */}
      <PortalNavbar onDrawerToggle={handleDrawerToggle} />
      
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
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          width: '100%', // Always full width since sidebar is only temporary
        }}
      >
        {children || <Outlet />}
      </Box>
    </Box>
  );
};

export default PortalLayout;
