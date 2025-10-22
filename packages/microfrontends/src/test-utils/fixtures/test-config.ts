import type { Config } from '../../config/schema/types';

export const TEST_CONFIG: Config = {
  version: '1',
  applications: {
    dashboard: {
      development: {
        fallback: 'vercel.com',
      },
    },
    docs: {
      routing: [],
    },
    marketing: {
      routing: [
        { group: 'home', paths: ['/home'] },
        { group: 'careers', paths: ['/careers', '/careers/:path*'] },
      ],
    },
    'nextjs-conf': {
      routing: [
        {
          group: 'next-conf-pages',
          paths: ['/conf', '/conf/:path*'],
        },
      ],
    },
  },
};
