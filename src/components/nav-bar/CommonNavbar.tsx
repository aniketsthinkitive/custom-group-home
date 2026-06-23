import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  PersonSearch as PersonSearchIcon,
  People as PeopleIcon,
  DescriptionOutlined as DescriptionIcon,
  ErrorOutline as ErrorOutlineIcon,
  CalendarToday as CalendarTodayIcon,
  SettingsOutlined as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutAsync, refreshAuthUser } from '../../store/slices/authSlice';
import { selectPermissionsLoaded } from '../../store/slices/permissionsSlice';
import { getImageUrl } from '../../utils';
import { getUserRoleType } from '../../utils/auth';
import { usePermission } from '../../hooks/usePermission';
// import logo from '../../assets/images/logo.svg?url';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../config/branding';

// Navigation item interface
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface CommonNavbarProps {
  onDrawerToggle?: () => void;
}

const CommonNavbar: React.FC<CommonNavbarProps> = ({ onDrawerToggle }) => {
  const theme = useTheme();
  // Show hamburger menu ONLY on screens < 1280px
  // For screens >= 1280px, persistent sidebar will be shown (no hamburger needed)
  const showHamburger = useMediaQuery('(max-width: 1279px)');
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Get user data from localStorage
  // const user = useMemo(() => {
  //   try {
  //     const userDataStr = localStorage.getItem('userData');
  //     if (userDataStr) {
  //       const parsedData = JSON.parse(userDataStr);
  //       // Extract user from data.user if the structure is {data: {user: {...}}}
  //       return parsedData?.data?.user || parsedData?.user || parsedData;
  //     }
  //   } catch (error) {
  //     console.error('Error parsing userData from localStorage:', error);
  //   }
  //   return null;
  // }, []);

  const { user } = useAuth();
  const hasRefreshedForMinimalUser = useRef(false);

  // If user exists but is minimal (no avatar_url), fetch full user once so navbar gets avatar
  useEffect(() => {
    if (!user?.uuid || hasRefreshedForMinimalUser.current) return;
    const u = user as { avatar_url?: string; group_home?: unknown };
    if (u.avatar_url !== undefined || u.group_home !== undefined) return;
    hasRefreshedForMinimalUser.current = true;
    dispatch(refreshAuthUser());
  }, [user?.uuid, user, dispatch]);

  // Prefer avatar_url from API; fallback to legacy profile fields
  const userWithAvatar = user as { avatar_url?: string; profilePhotoPath?: string; profilePicture?: string } | null;
  const profilePhotoPath =
    userWithAvatar?.avatar_url ||
    userWithAvatar?.profilePhotoPath ||
    userWithAvatar?.profilePicture ||
    null;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get user role type
  const roleType = getUserRoleType();
  const { canAccess } = usePermission();
  const permissionsLoaded = useAppSelector(selectPermissionsLoaded);

  // Navigation items filtered by the user's actual permissions.
  // Each tab maps to one or more permission modules — shown if user has
  // ANY permission in ANY of the listed modules.
  const navItems: NavItem[] = useMemo(() => {
    if (roleType !== 'ADMIN' && roleType !== 'STAFF') return [];

    const allItems: (NavItem & { modules: string[] })[] = [
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

    return allItems.filter((item) =>
      item.modules.some((mod) => canAccess(mod))
    );
  }, [roleType, canAccess]);

  // Redirect to profile if user has no permitted tabs
  useEffect(() => {
    if (!permissionsLoaded) return;                        // wait until permissions are loaded
    if (navItems.length > 0) return;                       // has accessible tabs — no redirect
    if (location.pathname === '/admin/profile') return;    // already on profile
    if (roleType !== 'ADMIN' && roleType !== 'STAFF') return; // non-staff handled by PortalNavbar
    navigate('/admin/profile', { replace: true });
  }, [permissionsLoaded, navItems.length, location.pathname, roleType, navigate]);

  const handleDrawerToggle = () => {
    if (onDrawerToggle) {
      onDrawerToggle();
    } else {
      setMobileOpen(!mobileOpen);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (showHamburger) {
      if (onDrawerToggle) {
        onDrawerToggle();
      } else {
        setMobileOpen(false);
      }
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewProfile = () => {
    handleUserMenuClose();
    navigate("/admin/profile");
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    try {
      await dispatch(logoutAsync()).unwrap();
    } catch {
      // logoutAsync clears state in finally; still redirect
    }
    navigate('/login', { replace: true });
  };

  const isActiveRoute = (path: string) => {
    if (path === '/admin/settings' && location.pathname.startsWith('/admin/user-details')) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  // Get user display name (User type uses first_name/last_name; support legacy camelCase)
  const userDisplay = user as { first_name?: string; last_name?: string; firstName?: string; lastName?: string; email?: string } | null;
  const firstName = userDisplay?.first_name || userDisplay?.firstName || '';
  const lastName = userDisplay?.last_name || userDisplay?.lastName || '';
  const userDisplayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : userDisplay?.email || 'User';

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#1E3A5F', // Dark blue background
          color: '#FFFFFF',
          boxShadow: 'none',
          height: '64px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ 
          minHeight: '64px !important', 
          height: '64px',
          padding: { xs: '0 16px', sm: '0 24px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '100%',
        }}>
          {/* Left side - Logo and Application Name */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flexShrink: 0,
          }}>
            {/* Mobile/Medium screen menu button */}
            {showHamburger && (
              <IconButton
                color="inherit"
                aria-label="menu"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  color: '#FFFFFF',
                  mr: 1,
                  transition: 'background-color 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}

            {/* Application Name */}
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '20px', sm: '24px' },
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              {APP_NAME}
            </Typography>
          </Box>

          {/* Center - Navigation Links */}
          {!showHamburger && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              gap: 0.5,
            }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  startIcon={item.icon}
                  sx={{
                    color: isActiveRoute(item.path) ? '#2C2D2C' : '#FFFFFF',
                    backgroundColor: isActiveRoute(item.path) ? '#FFFFFF' : 'transparent',
                    fontFamily: 'inherit',
                    fontWeight: isActiveRoute(item.path) ? 500 : 400,
                    fontSize: '15px',
                    textTransform: 'none',
                    px: 2.5,
                    py: 1.25,
                    borderRadius: '8px',
                    minHeight: '40px',
                    minWidth: 'auto',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: isActiveRoute(item.path) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                      color: isActiveRoute(item.path) ? '#2C2D2C' : '#FFFFFF',
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: '8px',
                      marginLeft: 0,
                      '& svg': {
                        fontSize: '20px',
                      }
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Right side - Search, Help, and Profile */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            flexShrink: 0 
          }}>
            {/* Search button */}
            {/* <IconButton 
              aria-label="search"
              sx={{ 
                color: '#FFFFFF',
                padding: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <SearchIcon sx={{ fontSize: '24px' }} />
            </IconButton> */}

            {/* Help button */}
            {/* <IconButton 
              aria-label="help"
              sx={{ 
                color: '#FFFFFF',
                padding: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <HelpIcon sx={{ fontSize: '24px' }} />
            </IconButton> */}

            {/* User Profile with Dropdown */}
            <Box 
              onClick={handleUserMenuOpen}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.75,
                ml: 0.5,
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '4px 8px',
                transition: 'background-color 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <Avatar 
                src={
                  profilePhotoPath
                    ? getImageUrl(profilePhotoPath)
                    : undefined
                }
                alt={userDisplayName}
                sx={{ 
                  width: '36px', 
                  height: '36px', 
                  bgcolor: '#bdbdbd',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {firstName?.[0] || ''}{lastName?.[0] || ''}
              </Avatar>
              <KeyboardArrowDownIcon 
                sx={{ 
                  color: '#FFFFFF',
                  fontSize: '18px',
                  transition: 'transform 0.2s ease-in-out',
                }} 
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E0E0E0',
          }
        }}
      >
        {/* Profile Section */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            src={
              profilePhotoPath
                ? getImageUrl(profilePhotoPath)
                : undefined
            }
            alt={userDisplayName}
            sx={{ 
              width: '40px', 
              height: '40px', 
              bgcolor: '#bdbdbd',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {firstName?.[0] || ''}{lastName?.[0] || ''}
          </Avatar>
          <Box>
            <Typography sx={{ 
              fontSize: '16px',
              fontWeight: 600,
              color: '#2C2D2C',
            }}>
              {userDisplayName}
            </Typography>
            <Typography
              component="a"
              onClick={handleViewProfile}
              sx={{
                fontSize: '14px',
                color: '#1976d2',
                textDecoration: 'underline',
                cursor: 'pointer',
                '&:hover': {
                  color: '#1565c0',
                }
              }}
            >
              View Profile
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Log Out Option */}
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.5, 
            px: 2,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
            <LogoutIcon sx={{ fontSize: '20px', color: '#2C2D2C' }} />
            <Typography sx={{ 
              fontSize: '15px', 
              color: '#2C2D2C', 
              fontWeight: 400,
            }}>
              Log Out
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
};

export default CommonNavbar;
