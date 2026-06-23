import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from './routes/routes';
import { theme } from './constant/styles/theme';
import { useAppDispatch } from './store/hooks';
import { checkAuthStatus } from './store/slices/authSlice';
import "./App.css";

// Inner component that has access to Redux store
function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check auth status on app load
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <>
      <Router basename="/">
        <AppRoutes />
      </Router>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
