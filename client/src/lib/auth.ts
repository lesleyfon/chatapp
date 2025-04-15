
import {
  LOCAL_STORAGE_AUTH_KEYS,
  LOCAL_STORAGE_AUTH_NAME,
} from "../store/useAuthStorage";


/**
 * The function `getBearer` retrieves an authentication token from local storage and returns it in a
 * format suitable for use in an HTTP Authorization header.
 * @returns The `getBearer` function returns a string that includes the word "Bearer" followed by the
 * value of the "auth_token" stored in the localStorage.
 */
export const getBearer = ():string | null => {
  const localStorageItem =
    localStorage.getItem(LOCAL_STORAGE_AUTH_NAME) ?? "{}";
  const authStorage = JSON.parse(localStorageItem) ?? {};
  const token: string =
    authStorage?.state?.[LOCAL_STORAGE_AUTH_KEYS.TOKEN] ?? "";
  if (token === "") {
    return null;
  }
  return `Bearer ${token}`;
};


export const isAuthenticated = ():boolean => {
  return !!getBearer();
};
