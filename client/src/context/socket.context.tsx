import { type ReactNode, createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { type Socket, io } from 'socket.io-client';

import { handleConnectError } from '../hooks/use-socket-auth';
import useAuthStorage from '../store/use-auth-storage';

const SocketContext = createContext<Socket | null>(null);

function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const navigate = useNavigate();
  const { token, logout } = useAuthStorage((state) => state);
  const APP_ENV = import.meta.env.VITE_APP_ENV;
  const { API_BASE_PATH } = JSON.parse(APP_ENV) as { API_BASE_PATH: string };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const socketInstance = io(API_BASE_PATH, {
      reconnectionDelay: 10000,
      timestampRequests: true,
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Add connection event listeners
    function handleConnect() {
      setIsConnected(true);
      setSocket(socketInstance);
    }

    socketInstance.on('connect', handleConnect);

    // Logo
    socketInstance.on('connect_error', (err: Error) =>
      handleConnectError({ err, logout, navigate }),
    );

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketInstance.off('connect_error', (err: Error) =>
        handleConnectError({ err, logout, navigate }),
      );

      setIsConnected(false);
      setSocket(null);
    };
  }, [token, API_BASE_PATH]);

  if (!isConnected) {
    return <div>Connecting to socket...</div>; // Or any loading component
  }

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export { SocketContext, SocketProvider };
