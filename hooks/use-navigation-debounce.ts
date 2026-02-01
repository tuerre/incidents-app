import { useCallback, useRef, useState } from "react";

export const useNavigationDebounce = (delay: number = 3000) => {
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeWithDebounce = useCallback(
    (callback: () => void) => {
      if (isDebouncing) return;

      setIsDebouncing(true);
      callback();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsDebouncing(false);
      }, delay);
    },
    [isDebouncing, delay],
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsDebouncing(false);
  }, []);

  return { isDebouncing, executeWithDebounce, reset };
};
