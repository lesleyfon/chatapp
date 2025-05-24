import { LogOutIcon } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { type NavigateFunction, useNavigate } from 'react-router';
import useAuthStorage from '../store/use-auth-storage';
import { Button } from './ui/button';

export const LogoutButton: FC = (): ReactNode => {
  const authStorageLogout = useAuthStorage((state) => state.logout);
  const navigate: NavigateFunction = useNavigate();

  const logoutHandler = (): void => {
    authStorageLogout();
    navigate('/');
  };
  return (
    <Button
      size='icon'
      role='combobox'
      variant='outline'
      className='border-0 p-0 bg-transparent  hover:bg-[#2f2f2f]'
      onClick={logoutHandler}
    >
      <LogOutIcon className='w-5 h-5' />
      <span className='sr-only'>Logout</span>
    </Button>
  );
};
