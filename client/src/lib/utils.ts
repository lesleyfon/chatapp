import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { LOCAL_STORAGE_AUTH_KEYS, LOCAL_STORAGE_AUTH_NAME } from "../store/useAuthStorage";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * The function calculates the time difference between a given date and the current date in days,
 * hours, minutes, or seconds and returns the result in a formatted string.
 * @param {Date} date - The `timeDifference` function calculates the time difference between the
 * provided date and the current date in terms of days, hours, minutes, or seconds.
 * @returns The function `timeDifference` calculates the time difference between the current date and a
 * given date in days, hours, minutes, or seconds, depending on the magnitude of the difference. The
 * function returns a string representing the time difference in the largest applicable unit (days,
 * hours, minutes, or seconds) rounded down to the nearest whole number.
 */
export function timeDifference(date: Date) {
	const currentDate = new Date();
	const previousDate = new Date(date);
	const difference:number = currentDate.getTime() - previousDate.getTime();
	const daysDifference = difference / (1000 * 3600 * 24);
	const hoursDifference = difference / (1000 * 3600);
	const minutesDifference = difference / (1000 * 60);
	const secondsDifference = difference / 1000;

	if (daysDifference > 7) {
		const d = new Date(date)
		return d.toLocaleDateString()
	}else if (daysDifference > 1) {
		return `${Math.floor(daysDifference)}d`;
	} else if (hoursDifference > 1) {
		return `${Math.floor(hoursDifference)}h`;
	} else if (minutesDifference > 1) {
		return `${Math.floor(minutesDifference)}m`;
	} else {
		return `${Math.floor(secondsDifference)}s`;
	}
}

export function formatDate(date: Date) {
	const timeStamps = new Date(date)
	return timeStamps.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	})
}


/**
 * The function `getBearer` retrieves an authentication token from local storage and returns it in a
 * format suitable for use in an HTTP Authorization header.
 * @returns The `getBearer` function returns a string that includes the word "Bearer" followed by the
 * value of the "auth_token" stored in the localStorage.
 */
export const getBearer = () => {
	const localStorageItem = localStorage.getItem(LOCAL_STORAGE_AUTH_NAME) ?? "{}"
	const authStorage = JSON.parse(localStorageItem) ?? {};
	const token:string = authStorage?.state?.[LOCAL_STORAGE_AUTH_KEYS.TOKEN] ?? ""

	return `Bearer ${token}`;
};


/**
 * The scrollToBottom function scrolls the last child element of a container into view.
 * @param lastElemRef - The `lastElemRef` parameter is a React mutable ref object that is used to
 * reference the last element in a container. This function `scrollToBottom` is designed to scroll the
 * last element into view within a container when called.
 */
export const scrollToBottom = (lastElemRef: React.MutableRefObject<null>) => {
	if (lastElemRef.current) {
		const messageSectionContainerRef = lastElemRef.current as HTMLElement;
		const lastChild = messageSectionContainerRef.lastElementChild;

		if (lastChild !== null) {
			lastChild.scrollIntoView();
		}
	}
};