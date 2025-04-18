import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { isAuthenticated } from '../../lib';
import { Login } from './login';
import { Register } from './registration';

import './style.css';

export default function Authentication() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/chats');
    }
  }, [navigate]);

  return (
    <div className='container h-screen w-screen flex justify-center items-center'>
      <div className='authentication-screen h-72'>
        <Tabs defaultValue='login' className='w-[560px]'>
          <TabsList className='grid grid-cols-2 w-full gap-8 mb-8 border border-gray-100 h-fit m-0 p-2 text-[#a1a1aa]'>
            <TabsTrigger value='login' className='transition ease-in-out'>
              Login
            </TabsTrigger>
            <TabsTrigger value='register' className='transition ease-in-out'>
              Register
            </TabsTrigger>
          </TabsList>
          <TabsContent value='login' className='flex items-center justify-center w-full'>
            <Login />
          </TabsContent>
          <TabsContent value='register' className='flex items-center justify-center w-full'>
            <Register />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
