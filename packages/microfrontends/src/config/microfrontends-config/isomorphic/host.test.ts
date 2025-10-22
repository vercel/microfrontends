import { Host, LocalHost } from './host';

describe('class Host', () => {
  describe('parseUrl', () => {
    it('parses protocol, host and port', () => {
      const result = new Host('https://cats.com:5959');
      expect(result.protocol).toBe('https');
      expect(result.host).toBe('cats.com');
      expect(result.port).toBe(5959);
    });

    it('adds default http port', () => {
      const result = new Host('http://cats.com');
      expect(result.protocol).toBe('http');
      expect(result.host).toBe('cats.com');
      expect(result.port).toBeUndefined();
    });

    it('adds default https port', () => {
      const result = new Host('https://cats.com');
      expect(result.protocol).toBe('https');
      expect(result.host).toBe('cats.com');
      expect(result.port).toBeUndefined();
    });

    it('parses just host', () => {
      const result = new Host('cats.com');
      expect(result.protocol).toBe('https');
      expect(result.host).toBe('cats.com');
      expect(result.port).toBeUndefined();
    });

    it('parses host and port', () => {
      const result = new Host('cats.com:5959');
      expect(result.protocol).toBe('https');
      expect(result.host).toBe('cats.com');
      expect(result.port).toBe(5959);
    });

    it('fails without host', () => {
      expect(() => new Host('')).toThrow();
      expect(() => new Host(':8080')).toThrow();
      expect(() => new Host('http://')).toThrow();
      expect(() => new Host('https://:8080')).toThrow();
    });

    it('fails with fragment', () => {
      expect(() => {
        const _ = new Host('cats.com/#orange');
      }).toThrow(
        new Error(
          'Microfrontends configuration error: the URL cats.com/#orange in your microfrontends.json cannot have a fragment.',
        ),
      );
    });

    it('fails with authentication', () => {
      expect(() => {
        const _ = new Host('https://admin:hunter2@cats.com');
      }).toThrow(
        new Error(
          'Microfrontends configuration error: the URL https://admin:hunter2@cats.com in your microfrontends.json cannot have authentication credentials (username and/or password).',
        ),
      );
      expect(() => {
        const _ = new Host('https://:hunter2@cats.com');
      }).toThrow(
        new Error(
          'Microfrontends configuration error: the URL https://:hunter2@cats.com in your microfrontends.json cannot have authentication credentials (username and/or password).',
        ),
      );
      expect(() => {
        const _ = new Host('https://admin:@cats.com');
      }).toThrow(
        new Error(
          'Microfrontends configuration error: the URL https://admin:@cats.com in your microfrontends.json cannot have authentication credentials (username and/or password).',
        ),
      );
    });

    it('fails with path', () => {
      expect(() => {
        const _ = new Host('cats.com:8080/orange');
      }).toThrow(
        new Error(
          'Microfrontends configuration error: the URL cats.com:8080/orange in your microfrontends.json cannot have a path.',
        ),
      );
    });

    it('fails with query parameters', () => {
      expect(() => {
        const _ = new Host('https://cats.com:8080/?orange');
      }).toThrow(
        new Error(
          'Microfrontends configuration error: the URL https://cats.com:8080/?orange in your microfrontends.json cannot have query parameters.',
        ),
      );
    });
  });

  describe('class LocalHost', () => {
    it('should default to localhost', () => {
      const host = new LocalHost({ appName: 'my-app' });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('localhost');
      expect(host.port).toBe(4400);
    });

    it('should parse host string', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: 'my.localhost.me',
      });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('my.localhost.me');
      expect(host.port).toBe(4400);
    });

    it('should parse protocol and host string', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: 'https://my.localhost.me',
      });
      expect(host.protocol).toBe('https');
      expect(host.host).toBe('my.localhost.me');
      expect(host.port).toBe(4400);
    });

    it('should parse host and port string', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: 'localhost.me:7664',
      });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('localhost.me');
      expect(host.port).toBe(7664);
    });

    it('should parse protocol, host and port string', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: 'http://my.localhost.com:7665',
      });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('my.localhost.com');
      expect(host.port).toBe(7665);
    });

    it('should read host config with host', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: { host: 'some.localhost.com' },
      });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('some.localhost.com');
      expect(host.port).toBe(4400);
    });

    it('should read host config with protocol and host', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: { protocol: 'https', host: 'my.localhost.me' },
      });
      expect(host.protocol).toBe('https');
      expect(host.host).toBe('my.localhost.me');
      expect(host.port).toBe(4400);
    });

    it('should read host config with host and port', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: { host: 'my.localhost.me', port: 7664 },
      });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('my.localhost.me');
      expect(host.port).toBe(7664);
    });

    it('should read host config with protocol, host and port', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: { protocol: 'http', host: 'my.localhost.com', port: 7665 },
      });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('my.localhost.com');
      expect(host.port).toBe(7665);
    });

    it('should parse local string', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: '7665',
      });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('localhost');
      expect(host.port).toBe(7665);
    });

    it('should parse local number', () => {
      const host = new LocalHost({
        appName: 'my-app',
        local: 7665,
      });
      expect(host.protocol).toBe('http');
      expect(host.host).toBe('localhost');
      expect(host.port).toBe(7665);
    });
  });
});
