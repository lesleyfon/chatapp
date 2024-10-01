import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
	token: string | null;
	userId: string | null;
	isLoggedIn: boolean;
	logout: () => void;
	login: (data: { userId: string; token: string }) => void;
}
// Constants for the auth storage
export const LOCAL_STORAGE_AUTH_NAME: string = "auth_storage";
export const LOCAL_STORAGE_AUTH_KEYS: Record<"TOKEN" | "USER_ID", string> = {
	TOKEN: "token",
	USER_ID: "userId",
};

// Create the auth storage with type safety
const useAuthStorage = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			userId: null,
			isLoggedIn: false,
			logout: () => {
				localStorage.removeItem(LOCAL_STORAGE_AUTH_KEYS.TOKEN);
				localStorage.removeItem(LOCAL_STORAGE_AUTH_KEYS.USER_ID);
				localStorage.removeItem(LOCAL_STORAGE_AUTH_NAME);

				return set({
					token: null,
					userId: null,
					isLoggedIn: false,
				});
			},
			login: (data: { userId: string; token: string }) => {
				localStorage.setItem(LOCAL_STORAGE_AUTH_KEYS.TOKEN, JSON.stringify(data.token));
				localStorage.setItem(LOCAL_STORAGE_AUTH_KEYS.USER_ID, JSON.stringify(data.userId));
				return set({
					token: data.token,
					userId: data.userId,
					isLoggedIn: true,
				});
			},
		}),
		{
			name: LOCAL_STORAGE_AUTH_NAME,
			storage: createJSONStorage(() => localStorage),
		}
	)
);

export default useAuthStorage;
