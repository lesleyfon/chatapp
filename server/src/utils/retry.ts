/**
 * The `retryPromise` function retries a given Promise-returning function a specified number of times
 * before throwing an error.
 * @param fn - The `fn` parameter is a function that returns a Promise. This function will be called to
 * attempt the operation that may fail and need to be retried.
 * @param {number} [retries=3] - The `retries` parameter in the `retryPromise` function specifies the
 * number of times the function should retry the provided promise if it fails. By default, the number
 * of retries is set to 3 if the `retries` parameter is not explicitly provided when calling the
 * function.
 * @returns The `retryPromise` function is being returned.
 */
export function retryPromise<T>(fn: () => Promise<T>, retries: number = 3): Promise<T> {
  return fn().catch((error) => {
    if (retries > 0) {
      return retryPromise(fn, retries - 1);
    }
    throw error;
  });
}
