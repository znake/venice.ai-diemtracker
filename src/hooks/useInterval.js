import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-refresh functionality using setInterval.
 * Follows the declarative useInterval pattern by Dan Abramov.
 * 
 * @param {Function} callback - The function to be executed at each interval.
 * @param {number|null} delay - The delay in milliseconds. If null, the interval is paused.
 */
function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default useInterval;
