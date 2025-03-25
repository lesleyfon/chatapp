import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Socket } from "socket.io-client";
import useAuthStorage from "../store/useAuthStorage";

/**
 * Manages socket authentication and connection for a Socket.IO client.
 *
 * This hook verifies that both an authentication token and user ID exist. If either is missing,
 * it redirects to the root path. When a valid socket instance is provided, the hook connects
 * the socket (if not already connected) and registers an event listener for connection errors.
 * A connection error with a 401 code triggers a logout and redirect, whereas a 500 code is reserved
 * for future handling of internal server errors.
 *
 * @param socket - A Socket.IO client instance or null.
 */
export function useSocketAuth({ socket }: { socket: Socket | null }) {
  const navigate = useNavigate();

  const { token, userId, logout } = useAuthStorage((state) => state);

  useEffect(() => {
    if (!token || !userId) {
      navigate("/");
      return;
    }
    const handleConnectError = (err: Error) => {
      try {
        const errObj = JSON.parse(err.message);

        if (err instanceof Error && "code" in errObj) {
          if (errObj.code === 401) {
            logout();
            navigate("/");
          } else if (errObj.code === 500) {
            // TODO: Implement toast message for internal server error
          }
        }
      } catch (parseError) {
        // eslint-disable-next-line no-console
        console.error("Failed to parse socket error message:", err.message);
      }
    };

    if (socket === null) return;

    if (socket.connected === false) {
      socket.connect();
      return;
    }

    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect_error", handleConnectError);
    };
  }, [token, userId, navigate, socket, logout]);
}
