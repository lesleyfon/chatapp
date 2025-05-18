import { useCallback, useLayoutEffect, useState } from 'react';

export const useSetScrollPosition = ({
  ref,
  data,
}: { ref: React.RefObject<HTMLDivElement>; data: unknown[] }) => {
  const [scrollAreaHeight, setScrollAreaHeight] = useState(0);

  const setScrollArea = useCallback(() => {
    if (ref.current) {
      const scrollArea = ref.current as HTMLElement;
      setScrollAreaHeight(scrollArea.clientHeight);
    }
  }, [ref]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useLayoutEffect(() => {
    if (ref.current) {
      setScrollArea();
    }

    if (typeof window === 'undefined' || !ref?.current) {
      setScrollAreaHeight(800);
    }

    const controller = new AbortController();
    const signal = controller.signal;

    window.addEventListener('resize', setScrollArea, { signal });

    return () => {
      controller.abort();
    };
  }, [data, ref, data.length]);

  return { scrollAreaHeight, setScrollArea };
};
