import { useNavigate } from "react-router";
import { useSocketInstance } from "../api/sockets";
import useAuthStorage from "../store/useAuthStorage";
import { useEffect } from "react";

export function useSocketAuth() {
	const socket = useSocketInstance();
	const navigate = useNavigate();
	const authStorageLogout = useAuthStorage((state) => state.logout);
	const { token, userId } = useAuthStorage((state) => state);

	const handleConnectError = (err: Error) => {
		try {
			const errObj = JSON.parse(err.message);

			if (err instanceof Error && "code" in errObj) {
				if (errObj.code === 401) {
					authStorageLogout();
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

	useEffect(() => {
		if (!token || !userId) {
			navigate("/");
			return;
		}

		if (socket === null) return;

		if (socket.connected === false) socket.connect();

		socket.on("connect_error", handleConnectError);

		return () => {
			socket.off("connect_error", handleConnectError);
		};
	}, [token, userId, navigate, socket]);
}
