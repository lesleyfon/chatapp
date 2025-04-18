import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';

import { SidebarProvider } from './components/ui/sidebar';
import { AppRouter } from './pages/app-router';

import './App.css';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <RouterProvider router={AppRouter} />
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;
