import { renderHook } from '@testing-library/react';
import { hashApplicationName } from '../../../config/microfrontends-config/isomorphic/utils/hash-application-name';
import './microfrontends-link.test.mocks';
import { useZoneForHref } from './microfrontends-link';

describe('useZoneForHref', () => {
  it('should return the correct zone from client config', () => {
    const { rerender, result } = renderHook((href: string) =>
      useZoneForHref(href),
    );
    rerender('/home');
    expect(result.current).toEqual({
      isDifferentZone: true,
      isLoading: false,
      zoneOfHref: hashApplicationName('marketing'),
    });
    rerender('/careers?department=Design');
    expect(result.current).toEqual({
      isDifferentZone: true,
      isLoading: false,
      zoneOfHref: hashApplicationName('marketing'),
    });
    rerender('/other');
    expect(result.current).toEqual({
      isDifferentZone: false,
      isLoading: false,
      zoneOfHref: hashApplicationName('dashboard'),
    });
  });
});
