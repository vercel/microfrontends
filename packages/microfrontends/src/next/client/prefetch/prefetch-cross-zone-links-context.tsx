import React, {
  createContext,
  useCallback,
  useRef,
  useMemo,
  useState,
  startTransition,
} from 'react';

export interface PrefetchCrossZoneLinksContext {
  prefetchHref: (href: string) => void;
}

export const PrefetchCrossZoneLinksContext =
  createContext<PrefetchCrossZoneLinksContext>({
    prefetchHref: () => {},
  });

export function PrefetchCrossZoneLinksProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element | null {
  const [seenHrefs, setSeenHrefs] = useState(new Set<string>());
  const isSafariOrFirefox = useRef(
    typeof navigator !== 'undefined' &&
      (navigator.userAgent.includes('Firefox') ||
        (navigator.userAgent.includes('Safari') &&
          !navigator.userAgent.includes('Chrome'))),
  );

  // This useCallback must not have any dependencies because if it changes
  // its value, every component that uses this context will rerender.
  const prefetchHref = useCallback((href: string): void => {
    // It's not critical that we render the new preload `<link>` elements
    // immediately. We want to batch together `prefetchHref` calls that
    // occur in one synchronous pass and only render once after they've all
    // called this callback.
    startTransition(() => {
      setSeenHrefs((prevHrefs) => {
        if (prevHrefs.has(href)) return prevHrefs;
        return new Set(prevHrefs).add(href);
      });
    });
  }, []);

  const value = useMemo(() => ({ prefetchHref }), [prefetchHref]);

  if (!isSafariOrFirefox.current) {
    return <>{children}</>;
  }

  return (
    <PrefetchCrossZoneLinksContext.Provider value={value}>
      {children}
      {[...seenHrefs].map((href) => (
        <link as="fetch" href={href} key={href} rel="preload" />
      ))}
    </PrefetchCrossZoneLinksContext.Provider>
  );
}
