import { io } from "socket.io-client";
import useAuthStorage from "../store/useAuthStorage";

export function useSocketInstance() {
  const token = useAuthStorage(state => state.token);

	if(!token) return null


  const socket = io("http://localhost:3010/", {
	reconnectionDelay: 10000,
	timestampRequests: true,
	auth: { token },
	transports: ["websocket", "polling", "flashsocket"],
  });

  return socket;
}