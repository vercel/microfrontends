import Script from 'next/script.js';
import { useEffect, useState } from 'react';
import { useClientConfig } from '../../../config/react/use-client-config';

const PREFETCH_ATTR = 'data-prefetch';
const DATA_ATTR_SELECTORS = {
  anyZone: '[data-zone]',
  external: '[data-zone="null"]',
  sameZone: '[data-zone="same"]',
  prefetch: `[${PREFETCH_ATTR}]`,
} as const;

const PREFETCH_ON_HOVER_PREDICATES = {
  and: [
    { href_matches: '/*' },
    { selector_matches: DATA_ATTR_SELECTORS.anyZone },
    { not: { selector_matches: DATA_ATTR_SELECTORS.sameZone } },
    { not: { selector_matches: DATA_ATTR_SELECTORS.external } },
  ],
};

const PREFETCH_WHEN_VISIBLE_PREDICATES = {
  and: [
    { href_matches: '/*' },
    { selector_matches: DATA_ATTR_SELECTORS.anyZone },
    { not: { selector_matches: DATA_ATTR_SELECTORS.sameZone } },
    { not: { selector_matches: DATA_ATTR_SELECTORS.external } },
    { selector_matches: DATA_ATTR_SELECTORS.prefetch },
  ],
};

function checkVisibility(element: Element | null): boolean {
  if (!element) return true;

  if ('checkVisibility' in element) {
    return element.checkVisibility({ opacityProperty: true });
  }

  // hack to get around TS thinking element is never;
  const el = element as Element;
  const style = window.getComputedStyle(el);

  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }

  return checkVisibility(el.parentElement);
}

interface PrefetchCrossZoneLinksProps {
  /**
   * This attributes controls how eager the browser should be in prerendering
   * cross-zone links. Prerendering downloads the HTML and subresources of the page
   * and starts to render the page in the background. This consumes more resources
   * but provides a faster user experience if the user decides to visit that page.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/speculationrules#eagerness
   * for more information.
   *
   * Default value is 'conservative'.
   */
  prerenderEagerness?: 'immediate' | 'eager' | 'moderate' | 'conservative';
}

export function PrefetchCrossZoneLinks({
  prerenderEagerness = 'conservative',
}: PrefetchCrossZoneLinksProps): JSX.Element | null {
  const { isLoading } = useClientConfig(
    process.env.NEXT_PUBLIC_MFE_CLIENT_CONFIG,
  );
  const [links, setLinks] = useState<HTMLAnchorElement[]>([]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    /**
     * Intersection observer to add the data-prefetch attribute to cross-zone
     * links that have yet to be prefetched and are visible.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !entry.target.hasAttribute(PREFETCH_ATTR) &&
            // lazy perform the visibility check for nodes that are intersecting the viewport
            // and have not been prefetched.
            checkVisibility(entry.target)
          ) {
            entry.target.setAttribute(PREFETCH_ATTR, 'true');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      },
    );

    links.forEach((link) => observer.observe(link));

    return () => {
      observer.disconnect();
    };
  }, [isLoading, links]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    /**
     * Mutation observer to notify when new nodes have entered/exited the document
     * or an href has changed.
     */
    const observer = new MutationObserver((mutations) => {
      const hasChanged = mutations.some((mutation) => {
        return (
          (mutation.type === 'childList' && mutation.addedNodes.length > 0) ||
          (mutation.type === 'attributes' && mutation.attributeName === 'href')
        );
      });

      if (hasChanged) {
        // Whenever there's a change, add all cross-zone links that haven't been
        // prefetched.
        setLinks(
          Array.from(
            document.querySelectorAll<HTMLAnchorElement>(
              `a${DATA_ATTR_SELECTORS.anyZone}:not(${DATA_ATTR_SELECTORS.prefetch}):not(${DATA_ATTR_SELECTORS.sameZone}):not(${DATA_ATTR_SELECTORS.external})`,
            ),
          ),
        );
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href'],
    });

    return () => {
      observer.disconnect();
    };
  }, [isLoading]);

  // Wait till the zone-config loads to take into consideration any
  // flagged routes.
  if (isLoading) {
    return null;
  }

  // Prefetch links with moderate eagerness by default, immediately when marked "data-prefetch".
  // Prerender links with conservative eagerness by default, immediately when marked "data-prefetch".
  const speculationRules = {
    prefetch: [
      {
        eagerness: 'moderate',
        where: PREFETCH_ON_HOVER_PREDICATES,
      },
      {
        eagerness: 'immediate',
        where: PREFETCH_WHEN_VISIBLE_PREDICATES,
      },
    ],
    prerender: [
      {
        eagerness: prerenderEagerness,
        where: PREFETCH_ON_HOVER_PREDICATES,
      },
    ],
  };

  return (
    <Script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe - injecting JSON speculation rules, not HTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(speculationRules),
      }}
      id="prefetch-zones-links"
      type="speculationrules"
    />
  );
}
