import { ReactNode, createContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import useAuthStorage from "../store/useAuthStorage";

const SocketContext = createContext<Socket | null>(null);

function SocketProvider({ children }: { children: ReactNode }) {
	const [socket, setSocket] = useState<Socket | null>(null);
	const token = useAuthStorage((state) => state.token);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const socketInstance = io("http://localhost:3010/", {
			reconnectionDelay: 10000,
			timestampRequests: true,
			auth: { token },
			transports: ["websocket", "polling"],
		});

		// Add connection event listeners
		function handleConnect() {
			setIsConnected(true);
			setSocket(socketInstance);
		}
		socketInstance.on("connect", handleConnect);

		socketInstance.on("disconnect", (reason) => {
			// eslint-disable-next-line no-console
			console.log("Socket disconnected:", reason);
			setIsConnected(false);
		});

		return () => {
			socketInstance.removeAllListeners();
			socketInstance.disconnect();
			setIsConnected(false);
			setSocket(null);
		};
	}, [token]);

	if (!isConnected) {
		return <div>Connecting to socket...</div>; // Or any loading component
	}

	return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export { SocketProvider, SocketContext };
