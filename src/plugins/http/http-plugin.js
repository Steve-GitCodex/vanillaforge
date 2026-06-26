/**
 * HTTP plugin — fetch wrapper for VanillaForge applications.
 *
 * Provides a thin, interceptor-aware fetch wrapper registered as the
 * 'http' service. Components and route loaders use it instead of calling
 * fetch() directly so that auth headers, base URLs, and error handling
 * stay in one place.
 *
 * Usage:
 *
 *   app.use(httpPlugin, { baseURL: '/api', headers: { 'X-App': '1' } });
 *
 *   // From a component:
 *   const http = this.service('http');
 *   const users = await http.get('/users');
 *   await http.post('/users', { name: 'Alice' });
 *
 *   // From a route loader:
 *   loader: async ({ params }) => app.get('http').get(`/users/${params.id}`)
 *
 *   // Auth interceptor:
 *   app.get('http').addInterceptor({
 *     request: (init) => {
 *       init.headers['Authorization'] = `Bearer ${getToken()}`;
 *       return init;
 *     },
 *   });
 *
 * Responses:
 *   - JSON content-type  → parsed object/array
 *   - Everything else    → text string
 *   - Pass { raw: true } in opts to receive the raw Response object
 *
 * Errors:
 *   Non-2xx responses throw an Error with .status, .statusText, and .body
 *   (parsed JSON when available, otherwise null).  Network failures throw the
 *   native fetch error.  Both run through error interceptors first.
 */

export class HttpService {
  /**
   * @param {string} baseURL - Prepended to every relative URL
   * @param {Record<string, string>} defaultHeaders - Merged into every request
   * @param {Array<HttpInterceptor>} interceptors
   */
  constructor(baseURL = '', defaultHeaders = {}, interceptors = []) {
    this._baseURL = baseURL;
    this._headers = { ...defaultHeaders };
    this._interceptors = [...interceptors];
  }

  // ---------------------------------------------------------------------------
  // HTTP verbs
  // ---------------------------------------------------------------------------

  /** @param {string} url @param {RequestOptions} [opts] */
  get(url, opts = {}) {
    return this._request('GET', url, null, opts);
  }

  /** @param {string} url @param {*} body @param {RequestOptions} [opts] */
  post(url, body, opts = {}) {
    return this._request('POST', url, body, opts);
  }

  /** @param {string} url @param {*} body @param {RequestOptions} [opts] */
  put(url, body, opts = {}) {
    return this._request('PUT', url, body, opts);
  }

  /** @param {string} url @param {*} body @param {RequestOptions} [opts] */
  patch(url, body, opts = {}) {
    return this._request('PATCH', url, body, opts);
  }

  /** @param {string} url @param {RequestOptions} [opts] */
  delete(url, opts = {}) {
    return this._request('DELETE', url, null, opts);
  }

  // ---------------------------------------------------------------------------
  // Header management
  // ---------------------------------------------------------------------------

  /** Set (or overwrite) a default header sent with every request. */
  setHeader(name, value) {
    this._headers[name] = value;
  }

  /** Remove a default header. */
  removeHeader(name) {
    delete this._headers[name];
  }

  // ---------------------------------------------------------------------------
  // Interceptors
  // ---------------------------------------------------------------------------

  /**
   * Register an interceptor.
   *
   * Each hook is optional:
   *   request(init)       → may mutate and return init; runs before fetch()
   *   response(response)  → may return a replacement Response; runs on 2xx
   *   error(err)          → runs on network errors and non-2xx; may re-throw
   *
   * Returns `this` for chaining.
   *
   * @param {{ request?: Function, response?: Function, error?: Function }} interceptor
   * @returns {HttpService}
   */
  addInterceptor(interceptor) {
    this._interceptors.push(interceptor);
    return this;
  }

  // ---------------------------------------------------------------------------
  // Core request
  // ---------------------------------------------------------------------------

  async _request(method, url, body, opts) {
    const fullURL = url.startsWith('http') || url.startsWith('//')
      ? url
      : this._baseURL + url;

    let init = {
      method,
      headers: { ...this._headers, ...(opts.headers || {}) },
    };

    if (body !== null && body !== undefined) {
      if (body instanceof FormData || body instanceof URLSearchParams || typeof body === 'string') {
        init.body = body;
      } else {
        init.body = JSON.stringify(body);
        if (!init.headers['Content-Type']) {
          init.headers['Content-Type'] = 'application/json';
        }
      }
    }

    // Forward any extra fetch options (signal, credentials, cache, etc.)
    const { raw } = opts;
    const extra = { ...opts };
    delete extra.headers;
    delete extra.raw;
    Object.assign(init, extra);

    // Request interceptors
    for (const ic of this._interceptors) {
      if (ic.request) {
        init = (await ic.request(init)) || init;
      }
    }

    let response;
    try {
      response = await fetch(fullURL, init);
    } catch (err) {
      for (const ic of this._interceptors) {
        if (ic.error) await ic.error(err);
      }
      throw err;
    }

    // Response interceptors (2xx and non-2xx alike, before error handling)
    for (const ic of this._interceptors) {
      if (ic.response) {
        response = (await ic.response(response)) || response;
      }
    }

    if (!response.ok) {
      let responseBody = null;
      try {
        const ct = response.headers.get('content-type') || '';
        responseBody = ct.includes('application/json')
          ? await response.json()
          : await response.text();
      } catch (_) { /* ignore parse failure */ }

      const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
      err.status = response.status;
      err.statusText = response.statusText;
      err.body = responseBody;

      for (const ic of this._interceptors) {
        if (ic.error) await ic.error(err);
      }
      throw err;
    }

    if (raw) return response;

    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }
}

/**
 * Install the HTTP plugin.
 *
 * Options:
 *   baseURL   {string}                  - Prepended to all relative URLs (default '')
 *   headers   {Record<string, string>}  - Default headers (default {})
 *   interceptors {Array}                - Initial interceptors (default [])
 *
 * After install, access the service via:
 *   this.service('http')       from a component
 *   app.get('http')            from app-level code / route loaders
 *
 * @type {import('../../framework.js').Plugin}
 */
export const httpPlugin = {
  name: 'http',

  install(app, { baseURL = '', headers = {}, interceptors = [] } = {}) {
    app.provide('http', new HttpService(baseURL, headers, interceptors));
  },
};
