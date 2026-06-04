import { useState, useEffect, useRef } from "react";

export function useDebouncedDimensions(debounceDelay = 250) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMeasureRef = useRef(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;

      // Immediate first measure to prevent 250ms layout white-space lag on mount
      if (isFirstMeasureRef.current) {
        isFirstMeasureRef.current = false;
        setDimensions({ width, height });
        return;
      }

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = setTimeout(() => {
        setDimensions({ width, height });
      }, debounceDelay);
    });

    resizeObserver.observe(element);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [debounceDelay]);

  return { containerRef, dimensions };
}
