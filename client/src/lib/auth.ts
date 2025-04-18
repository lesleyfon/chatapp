import { LOCAL_STORAGE_AUTH_KEYS, LOCAL_STORAGE_AUTH_NAME } from '../store/use-auth-storage';

/**
 * The function `getBearer` retrieves an authentication token from local storage and returns it in a
 * format suitable for use in an HTTP Authorization header.
 * @returns The `getBearer` function returns a string that includes the word "Bearer" followed by the
 * value of the "auth_token" stored in the localStorage.
 */
export function getBearer(): string | null {
  const localStorageItem = localStorage.getItem(LOCAL_STORAGE_AUTH_NAME) ?? '{}';
  const authStorage = JSON.parse(localStorageItem) ?? {};
  const token: string = authStorage?.state?.[LOCAL_STORAGE_AUTH_KEYS.TOKEN] ?? '';
  if (token === '') {
    return null;
  }
  return `Bearer ${token}`;
}

/**
 *@description The function `isAuthenticated` checks if the user is currently authenticated by verifying if a valid bearer token exists in the local storage.
 *@return {boolean} A boolean value indicating whether the user is authenticated (true) or not (false).
 */
export function isAuthenticated(): boolean {
  return !!getBearer();
}
