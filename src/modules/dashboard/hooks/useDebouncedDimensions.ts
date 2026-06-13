import { useState, useEffect, useRef } from "react";

export function useDebouncedDimensions(debounceDelay = 250) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 250 }); // Set a stable default height
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutIdRef = useRef<any>(null);
  const isFirstMeasureRef = useRef(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      // Use clientWidth/clientHeight or contentRect width.
      // We only observe width or use a stable height to avoid layout cycles where the chart draws,
      // expands the parent, ResizeObserver fires, chart redraws larger, parent expands further, etc.
      const width = entries[0].contentRect.width;
      
      // Let's keep height stable or read from a non-flex container to prevent vertical feedback loops
      const height = element.clientHeight || 250;

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
