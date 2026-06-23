// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/store'
import { queryClient } from './queryClient'
import { installMocks } from './mocks'
import './index.css'
import App from './App.tsx'

// No-backend prototype: serve every API request from the localStorage-backed mock layer.
// Must run before the app issues any request (App dispatches checkAuthStatus on mount).
installMocks();

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Provider>
  // </StrictMode>,
);
