import { io } from "socket.io-client";
export function createSocketInstance(){
  const token = localStorage.getItem("auth_token");
		const socket = io("http://localhost:3010/", {
			reconnectionDelay: 10000,
			timestampRequests: true,
			auth: { token },
			transports: ["websocket", "polling", "flashsocket"],
		});

    return socket
}