import { useState, useEffect, useRef } from 'react';

export function useThrottledValue<T>(value: T, fps: number = 10): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdate = useRef(0);
  const rafId = useRef<number>(undefined);

  useEffect(() => {
    const interval = 1000 / fps;
    const now = Date.now();

    if (now - lastUpdate.current >= interval) {
      lastUpdate.current = now;
      setThrottled(value);
    } else {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        lastUpdate.current = Date.now();
        setThrottled(value);
      });
    }

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [value, fps]);

  return throttled;
}
