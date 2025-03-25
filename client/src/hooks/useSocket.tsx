import { useContext } from "react";
import { SocketContext } from "../context/socket.context";

/**
 * Returns the current socket instance from the context.
 *
 * This hook accesses the socket from the SocketContext and ensures it is defined.
 * If no socket is available, it throws an error, indicating that the hook is used outside
 * of a SocketProvider.
 *
 * @returns The current socket instance.
 * @throws {Error} If no socket is found, meaning that useSocket is used outside of a SocketProvider.
 */
export function useSocket() {
  const socket = useContext(SocketContext);

  if (!socket) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return socket;
}
