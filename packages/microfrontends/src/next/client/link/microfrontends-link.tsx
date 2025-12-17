import NextLink, {
  type LinkProps as ExternalNextLinkProps,
} from 'next/link.js';
import type { AnchorHTMLAttributes } from 'react';
import { forwardRef, useContext, useMemo } from 'react';
import { useClientConfig } from '../../../config/react/use-client-config';
import { PrefetchCrossZoneLinksContext } from '../prefetch';

interface BaseProps {
  children: React.ReactNode;
  href: string;
}

// fix for tsc inlining LinkProps from next
// https://github.com/microsoft/TypeScript/issues/37151#issuecomment-756232934
interface NextLinkProps extends ExternalNextLinkProps {}
export type LinkProps = BaseProps &
  Omit<NextLinkProps, keyof BaseProps> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps>;

const CURRENT_ZONE_HASH = process.env.NEXT_PUBLIC_MFE_CURRENT_APPLICATION_HASH;

export function useZoneForHref(href: LinkProps['href'] | undefined): {
  zoneOfHref: string | null;
  isDifferentZone: boolean;
  isLoading: boolean;
} {
  const { clientConfig, isLoading } = useClientConfig(
    process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG,
  );
  const { isRelativePath, zoneOfHref } = useMemo(() => {
    const isRelative = typeof href === 'string' && href.startsWith('/');
    return {
      isRelativePath: isRelative,
      zoneOfHref: isRelative
        ? clientConfig.getApplicationNameForPath(href)
        : null,
    };
  }, [clientConfig, href]);

  if (typeof href === 'string' && !href.length) {
    return {
      zoneOfHref: null,
      isDifferentZone: false,
      isLoading: false,
    };
  }
  const isDifferentZone =
    !isRelativePath || (zoneOfHref ? CURRENT_ZONE_HASH !== zoneOfHref : false);
  return { zoneOfHref, isDifferentZone, isLoading };
}

/**
 * A Link component that works with microfrontend set-ups and will prefetch the
 * cross zone links automatically.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, ...props }, ref): JSX.Element => {
    const { prefetchHref } = useContext(PrefetchCrossZoneLinksContext);
    const { zoneOfHref, isDifferentZone, isLoading } = useZoneForHref(
      props.href,
    );

    function onHoverPrefetch(): void {
      if (!props.href) {
        return;
      }
      prefetchHref(props.href);
    }

    if (isDifferentZone && zoneOfHref !== null) {
      const { prefetch: _, ...rest } = props;
      return (
        <a
          {...rest}
          data-zone={zoneOfHref}
          onFocus={props.prefetch !== false ? onHoverPrefetch : undefined}
          onMouseOver={props.prefetch !== false ? onHoverPrefetch : undefined}
        >
          {children}
        </a>
      );
    }

    return (
      <NextLink
        {...props}
        data-zone={!zoneOfHref ? 'null' : 'same'}
        prefetch={props.prefetch ?? (isLoading ? false : undefined)}
        ref={ref}
      >
        {children}
      </NextLink>
    );
  },
);
Link.displayName = 'MicrofrontendsLink';
