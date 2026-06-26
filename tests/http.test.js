import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpService, httpPlugin } from '../src/plugins/http/http-plugin.js';

// ---------------------------------------------------------------------------
// Minimal fetch mock helpers
// ---------------------------------------------------------------------------

function makeFetch(status, body, contentType = 'application/json') {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { get: () => contentType },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// HttpService — basic verbs
// ---------------------------------------------------------------------------

describe('HttpService.get', () => {
  it('calls fetch with GET and the correct URL', async () => {
    const fetch = makeFetch(200, { id: 1 });
    vi.stubGlobal('fetch', fetch);

    const http = new HttpService('/api');
    await http.get('/users');

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/users');
    expect(init.method).toBe('GET');
  });

  it('leaves absolute URLs unchanged', async () => {
    const fetch = makeFetch(200, {});
    vi.stubGlobal('fetch', fetch);
    const http = new HttpService('/api');
    await http.get('https://other.example.com/data');
    expect(fetch.mock.calls[0][0]).toBe('https://other.example.com/data');
  });

  it('resolves with parsed JSON', async () => {
    vi.stubGlobal('fetch', makeFetch(200, [1, 2, 3]));
    const http = new HttpService('');
    const result = await http.get('/nums');
    expect(result).toEqual([1, 2, 3]);
  });

  it('resolves with text when content-type is not JSON', async () => {
    vi.stubGlobal('fetch', makeFetch(200, 'hello', 'text/plain'));
    const http = new HttpService('');
    const result = await http.get('/hello');
    expect(result).toBe('hello');
  });

  it('returns raw Response when opts.raw is true', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));
    const http = new HttpService('');
    const result = await http.get('/x', { raw: true });
    expect(result).toBe(mockResponse);
  });
});

describe('HttpService.post', () => {
  it('serialises objects as JSON and sets Content-Type', async () => {
    const fetch = makeFetch(201, { id: 42 });
    vi.stubGlobal('fetch', fetch);
    const http = new HttpService('/api');
    await http.post('/users', { name: 'Alice' });

    const [, init] = fetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"Alice"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('does not override a caller-supplied Content-Type', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    await http.post('/upload', 'raw', { headers: { 'Content-Type': 'text/plain' } });
    const [, init] = (await vi.mocked(fetch)).mock.calls[0];
    // text body passed as-is
    expect(init.body).toBe('raw');
  });

  it('passes FormData without JSON serialisation', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    const fd = new FormData();
    await http.post('/upload', fd);
    const [, init] = fetch.mock.calls[0];
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers['Content-Type']).toBeUndefined();
  });
});

describe('HttpService.put / patch / delete', () => {
  it('put uses PUT method', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    await http.put('/x', {});
    expect(fetch.mock.calls[0][1].method).toBe('PUT');
  });

  it('patch uses PATCH method', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    await http.patch('/x', {});
    expect(fetch.mock.calls[0][1].method).toBe('PATCH');
  });

  it('delete uses DELETE method and sends no body', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    await http.delete('/x');
    const [, init] = fetch.mock.calls[0];
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Default headers
// ---------------------------------------------------------------------------

describe('HttpService default headers', () => {
  it('merges default headers into every request', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('', { 'X-App': 'vf' });
    await http.get('/x');
    expect(fetch.mock.calls[0][1].headers['X-App']).toBe('vf');
  });

  it('setHeader adds a header for subsequent requests', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    http.setHeader('Authorization', 'Bearer token123');
    await http.get('/secure');
    expect(fetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer token123');
  });

  it('removeHeader stops sending the header', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('', { 'X-Remove': 'yes' });
    http.removeHeader('X-Remove');
    await http.get('/x');
    expect(fetch.mock.calls[0][1].headers['X-Remove']).toBeUndefined();
  });

  it('per-request headers override defaults', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('', { 'X-App': 'default' });
    await http.get('/x', { headers: { 'X-App': 'override' } });
    expect(fetch.mock.calls[0][1].headers['X-App']).toBe('override');
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('HttpService non-2xx errors', () => {
  it('throws with .status and .body on non-2xx', async () => {
    vi.stubGlobal('fetch', makeFetch(404, { message: 'Not found' }));
    const http = new HttpService('');
    await expect(http.get('/missing')).rejects.toMatchObject({
      status: 404,
      body: { message: 'Not found' },
    });
  });

  it('throws on 500 with text body when content-type is not JSON', async () => {
    vi.stubGlobal('fetch', makeFetch(500, 'Server error', 'text/plain'));
    const http = new HttpService('');
    await expect(http.get('/boom')).rejects.toMatchObject({
      status: 500,
      body: 'Server error',
    });
  });

  it('throws the native fetch error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const http = new HttpService('');
    await expect(http.get('/x')).rejects.toThrow('Failed to fetch');
  });
});

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------

describe('HttpService interceptors', () => {
  it('request interceptor can mutate init', async () => {
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    http.addInterceptor({
      request: (init) => {
        init.headers['X-Token'] = 'abc';
        return init;
      },
    });
    await http.get('/secure');
    expect(fetch.mock.calls[0][1].headers['X-Token']).toBe('abc');
  });

  it('response interceptor receives the Response object', async () => {
    const responseSpy = vi.fn((r) => r);
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    http.addInterceptor({ response: responseSpy });
    await http.get('/x');
    expect(responseSpy).toHaveBeenCalledOnce();
  });

  it('error interceptor is called on non-2xx', async () => {
    const errorSpy = vi.fn();
    vi.stubGlobal('fetch', makeFetch(401, { error: 'Unauthorized' }));
    const http = new HttpService('');
    http.addInterceptor({ error: errorSpy });
    await expect(http.get('/admin')).rejects.toMatchObject({ status: 401 });
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('error interceptor is called on network failure', async () => {
    const errorSpy = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));
    const http = new HttpService('');
    http.addInterceptor({ error: errorSpy });
    await expect(http.get('/x')).rejects.toThrow();
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it('addInterceptor returns this for chaining', () => {
    const http = new HttpService('');
    expect(http.addInterceptor({})).toBe(http);
  });

  it('multiple interceptors run in registration order', async () => {
    const order = [];
    vi.stubGlobal('fetch', makeFetch(200, {}));
    const http = new HttpService('');
    http.addInterceptor({ request: (i) => { order.push(1); return i; } });
    http.addInterceptor({ request: (i) => { order.push(2); return i; } });
    await http.get('/x');
    expect(order).toEqual([1, 2]);
  });
});

// ---------------------------------------------------------------------------
// Plugin installation
// ---------------------------------------------------------------------------

describe('httpPlugin', () => {
  it('registers an HttpService as the http service', () => {
    const services = new Map();
    const mockApp = {
      provide: (name, svc) => services.set(name, svc),
      eventBus: {},
    };
    httpPlugin.install(mockApp, { baseURL: '/api' });
    expect(services.get('http')).toBeInstanceOf(HttpService);
  });

  it('has the name "http"', () => {
    expect(httpPlugin.name).toBe('http');
  });
});
