import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";


dayjs.extend(utc);
dayjs.extend(timezone)


/**
 * Gets the current timezone name in IANA format (e.g., "America/Chicago")
 * @returns {string} The timezone name
 * @example "America/Chicago"
 */
export function getBrowserTimeZone(): string {
  try {
    // Get the timezone from the browser using Intl API
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting timezone:', error);
    return 'UTC'; // Fallback to UTC if there's an error
  }
}

/**
 * Formats a date to a specific timezone.
 * @param {Date | string} date - The date to format.
 * @param {string} timeZone - The timezone to format the date to.
 * @returns {string} The formatted date in the user's current timezone.
 */
export function formatDate(date: Date | string, timeZone:string = "America/Chicago") {

  // If the timezones are the same, we just return the date in the user's timezone.
  // else: Convert the transaction date to the user's timezone.
   

  const browserTimeZone = getBrowserTimeZone();
  
  
  try{
    if(browserTimeZone === timeZone) {
      const inputDate = dayjs.tz(date, timeZone);
      return inputDate.format('MMM DD, YYYY hh:mm A');
    }
    
    const transactionTimestampToBrowserTimezone = dayjs.tz(date, timeZone).tz(browserTimeZone);
    return transactionTimestampToBrowserTimezone.format('MMM DD, YYYY hh:mm A');
    }catch(error){
      // eslint-disable-next-line no-console
      console.error(`Error formatting date with timezone ${timeZone}:`, error);
      const fallbackDate = dayjs.tz(date, browserTimeZone)
      return fallbackDate.format('MMM DD, YYYY hh:mm A');
    }
}


/**
 * Replaces the 'Z' UTC indicator in an ISO 8601 datetime string with the CST (-06:00) offset
 * @param {string} utcDateTimeString - The datetime string with 'Z' indicating UTC
 * @returns {string} The datetime string with CST offset instead of 'Z'
 */
function replaceZWithCSTOffset(utcDateTimeString: string) {
  // Check if the string ends with 'Z'
  // TODO: ADD implementation for when timezone is provided
  if (!utcDateTimeString.endsWith("Z")) {
    // eslint-disable-next-line no-console
    // console.error("Input string must be in UTC format ending with Z: ", utcDateTimeString);
    return utcDateTimeString;
  }

  
  return utcDateTimeString.slice(0, -1) + "-07:00";
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
export function timeDifference(date: string, timeZone:string="America/Chicago") {
  const now = new Date();
  const inputDate = new Date(replaceZWithCSTOffset(date));
  
  const transactionDate = new Date(inputDate.toLocaleString("en-US", { timeZone }));
  const currentTime = new Date(now.toLocaleString("en-US", { timeZone }));
  

  const daysDifference = dayjs(currentTime).diff(dayjs(transactionDate), "day");
  const hoursDifference = dayjs(currentTime).diff(dayjs(transactionDate), "hour");
  const minutesDifference = dayjs(currentTime).diff(dayjs(transactionDate), "minute");
  const secondsDifference = dayjs(currentTime).diff(dayjs(transactionDate), "second");
  
  if (daysDifference >= 7) {
    return transactionDate.toLocaleDateString();
  } else if (daysDifference >= 1) {
    return `${Math.floor(daysDifference)}d`;
  } else if (hoursDifference >= 1) {
    return `${Math.floor(hoursDifference)}h`;
  } else if (minutesDifference >= 1) {
    return `${Math.floor(minutesDifference)}m`;
  } else {
    return `${Math.floor(secondsDifference)}s`;
  }
}



/**
 * Gets the current date and time with the user's timezone offset
 * @returns {string} ISO 8601 formatted datetime string with timezone information
 * @example "2025-04-02T12:00:00.000-07:00"
 */
export function getCurrentDateTimeWithTimezone() {
  const now = new Date();

  // Get timezone offset in minutes
  const timezoneOffsetMinutes = now.getTimezoneOffset();

  // Format the date part: YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Format the time part: HH:MM:SS.sss
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  // Build the base datetime string
  const dateTimeBase = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;

  // Handle timezone format
  if (timezoneOffsetMinutes === 0) {
    // UTC time (Zulu time)
    return `${dateTimeBase}Z`;
  } else {
    // Convert timezone offset to ISO format (+/-HH:MM)
    // Note: getTimezoneOffset() returns minutes WEST of UTC, so we need to flip the sign
    const offsetSign = timezoneOffsetMinutes > 0 ? "-" : "+";
    const absoluteOffset = Math.abs(timezoneOffsetMinutes);
    const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(
      2,
      "0",
    );
    const offsetMinutes = String(absoluteOffset % 60).padStart(2, "0");

    return `${dateTimeBase}${offsetSign}${offsetHours}:${offsetMinutes}`;
  }
}
