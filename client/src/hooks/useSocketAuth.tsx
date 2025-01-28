import { useNavigate } from "react-router";
import useAuthStorage from "../store/useAuthStorage";
import { useEffect } from "react";
import { Socket } from "socket.io-client";

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
