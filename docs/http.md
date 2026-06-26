# HTTP Plugin

The `httpPlugin` provides a fetch wrapper registered as the `'http'` service.
It handles base URLs, default headers, and interceptors in one place so every
component and route loader uses consistent request behaviour.

---

## Install

```js
import { createApp, httpPlugin } from 'vanillaforge';

const app = createApp({ appName: 'My App' });

app.use(httpPlugin, {
  baseURL: '/api',
  headers: { 'X-App-Version': '1.0' },
});

await app.initialize({ routes });
await app.start();
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | `''` | Prepended to every relative URL |
| `headers` | `Record<string,string>` | `{}` | Sent with every request |
| `interceptors` | `HttpInterceptor[]` | `[]` | Initial interceptors (see below) |

---

## HTTP verbs

```js
const http = this.service('http');          // from a component
const http = app.get('http');              // from app-level code or a loader

const users    = await http.get('/users');
const user     = await http.post('/users', { name: 'Alice' });
const updated  = await http.put('/users/1', { name: 'Alicia' });
const patched  = await http.patch('/users/1', { name: 'Al' });
await http.delete('/users/1');
```

All methods return:
- A parsed **object or array** when the response `Content-Type` is `application/json`
- A **string** for all other content types
- The raw **`Response`** object when `{ raw: true }` is passed in options

### Per-request options

Any option accepted by the native `fetch()` `RequestInit` can be passed:

```js
const data = await http.get('/data', {
  headers: { 'Accept': 'text/csv' },   // merged on top of defaults
  signal: abortController.signal,       // AbortController support
  credentials: 'include',
  raw: true,                            // returns the raw Response
});
```

---

## Non-2xx errors

When the server returns a non-2xx status code, the method throws an error with
three extra properties:

```js
try {
  await http.delete('/users/99');
} catch (err) {
  console.log(err.status);     // 404
  console.log(err.statusText); // 'Not Found'
  console.log(err.body);       // parsed JSON body, or text, or null
}
```

Network failures (offline, DNS error, timeout) throw the native `TypeError`
from `fetch()`.

---

## Default headers

```js
const http = app.get('http');

// Add or overwrite a header for all subsequent requests
http.setHeader('Authorization', `Bearer ${token}`);

// Remove a header
http.removeHeader('Authorization');
```

---

## Interceptors

Interceptors hook into the request/response cycle. Each interceptor is an
object with up to three optional hooks:

```js
http.addInterceptor({
  // Runs before fetch() — mutate and return init
  request: (init) => {
    init.headers['Authorization'] = `Bearer ${getToken()}`;
    return init;
  },

  // Runs on every 2xx response — may return a replacement Response
  response: (response) => {
    console.log('Response status:', response.status);
    return response; // must return response (or a replacement)
  },

  // Runs on non-2xx status codes AND network errors
  error: (err) => {
    if (err.status === 401) app.navigate('/login');
  },
});
```

Multiple interceptors are chained in registration order.
`addInterceptor()` returns `this` so calls can be chained:

```js
http
  .addInterceptor(authInterceptor)
  .addInterceptor(loggingInterceptor);
```

---

## Usage with route loaders

The most common pattern — fetch data before a route component mounts:

```js
await app.initialize({
  routes: {
    '/users/:id': {
      component: UserDetailComponent,
      loader: async ({ params }) => {
        return app.get('http').get(`/users/${params.id}`);
      },
    },
  },
});
```

The resolved value is available as `this.props.data` on the first render:

```js
getTemplate() {
  const user = this.props.data;
  if (!user) return html`<p>Not found.</p>`;
  return html`<h1>${user.name}</h1><p>${user.email}</p>`;
}
```

---

## Token refresh example

```js
let isRefreshing = false;

http.addInterceptor({
  error: async (err) => {
    if (err.status !== 401 || isRefreshing) return;
    isRefreshing = true;
    try {
      const { token } = await http.post('/auth/refresh');
      http.setHeader('Authorization', `Bearer ${token}`);
    } finally {
      isRefreshing = false;
    }
  },
});
```
