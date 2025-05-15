import type { FC } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';

import ChatRoomLayout from '../../components/layout/chat-room';
import Header from '../../components/layout/nav';
import Sidebar from '../../components/layout/nav/sidebar';
import { isAuthenticated } from '../../lib/auth';
import Authentication from '../authentication/index';

export const ProtectedRoute: FC<{ isAuthenticated: () => boolean }> = ({ isAuthenticated }) => {
  return isAuthenticated() ? <Outlet /> : <Navigate to='/' replace />;
};

const MainLayout = () => (
  <div className='h-screen border-collapse overflow-hidden w-screen'>
    <main className='flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pb-1 grid md:grid-cols-[1fr_11fr]'>
      <Sidebar className='relative hidden h-full md:grid' />
      <div className='grid grid-rows-[1fr_11fr] h-screen'>
        <Header />
        <Outlet />
      </div>
    </main>
  </div>
);

export const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <Authentication />,
  },
  {
    element: <ProtectedRoute isAuthenticated={isAuthenticated} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/chats',
            element: null, // Empty view when no chat is selected
          },
          {
            path: '/chats/:chatId',
            element: <ChatRoomLayout />, // OUTLET
          },
          {
            path: '/private-chats/:uniquePrivateChatKey',
            element: <ChatRoomLayout />, // OUTLET
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <p>404 Error - Nothing here...</p>,
  },
]);
