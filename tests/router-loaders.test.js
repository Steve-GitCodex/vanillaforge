/**
 * Tests for route loaders.
 *
 * A route loader is an async function assigned to a route config object:
 *   addRoute('/path', { component: MyComp, loader: async ({ params, path }) => data })
 *
 * The loader runs before the component mounts; its return value is passed to
 * the component as props.data via the router:load-component event payload.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from '../src/core/router.js';
import { EventBus } from '../src/core/event-bus.js';

class HomeView {}
class UserView {}

function makeRouter(config = {}) {
  return new Router(new EventBus(), undefined, undefined, config);
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

// ---------------------------------------------------------------------------
// Loader is called with the right context
// ---------------------------------------------------------------------------

describe('route loader — invocation', () => {
  it('calls the loader before emitting router:load-component', async () => {
    const r = makeRouter();
    const callOrder = [];

    const loader = vi.fn().mockImplementation(async () => {
      callOrder.push('loader');
      return { items: [1, 2, 3] };
    });

    r.addRoute('/', { component: HomeView, loader });
    r.eventBus.on('router:load-component', () => callOrder.push('mount'));

    await r.navigateTo('/');

    expect(callOrder).toEqual(['loader', 'mount']);
  });

  it('calls the loader with { params, path }', async () => {
    const r = makeRouter();
    const loader = vi.fn().mockResolvedValue(null);
    r.addRoute('/users/:id', { component: UserView, loader });
    r.eventBus.on('router:load-component', () => {});

    await r.navigateTo('/users/42');

    expect(loader).toHaveBeenCalledWith({ params: { id: '42' }, path: '/users/42' });
  });

  it('passes the loader return value as loaderData on the event', async () => {
    const r = makeRouter();
    const data = { user: { name: 'Alice' } };
    const loader = vi.fn().mockResolvedValue(data);
    r.addRoute('/users/:id', { component: UserView, loader });

    const received = vi.fn();
    r.eventBus.on('router:load-component', received);

    await r.navigateTo('/users/7');

    expect(received.mock.calls[0][0].loaderData).toBe(data);
  });

  it('passes loaderData for a static route (no params)', async () => {
    const r = makeRouter();
    const loader = vi.fn().mockResolvedValue([1, 2, 3]);
    r.addRoute('/', { component: HomeView, loader });

    const received = vi.fn();
    r.eventBus.on('router:load-component', received);

    await r.navigateTo('/');

    expect(received.mock.calls[0][0].loaderData).toEqual([1, 2, 3]);
    expect(loader).toHaveBeenCalledWith({ params: {}, path: '/' });
  });
});

// ---------------------------------------------------------------------------
// Routes without a loader are unaffected
// ---------------------------------------------------------------------------

describe('route loader — backward compatibility', () => {
  it('does not set loaderData when no loader is registered', async () => {
    const r = makeRouter();
    r.addRoute('/', HomeView);

    const received = vi.fn();
    r.eventBus.on('router:load-component', received);

    await r.navigateTo('/');

    expect(received.mock.calls[0][0].loaderData).toBeUndefined();
  });

  it('still mounts the component when the route has no loader', async () => {
    const r = makeRouter();
    r.addRoute('/', HomeView);

    const received = vi.fn();
    r.eventBus.on('router:load-component', received);

    await r.navigateTo('/');

    expect(received).toHaveBeenCalledTimes(1);
    expect(received.mock.calls[0][0].component).toBe(HomeView);
  });
});

// ---------------------------------------------------------------------------
// Loader error handling — component still mounts with undefined data
// ---------------------------------------------------------------------------

describe('route loader — error handling', () => {
  it('mounts the component even when the loader rejects', async () => {
    const r = makeRouter();
    const loader = vi.fn().mockRejectedValue(new Error('network error'));
    r.addRoute('/', { component: HomeView, loader });

    const received = vi.fn();
    r.eventBus.on('router:load-component', received);

    await r.navigateTo('/');

    expect(received).toHaveBeenCalledTimes(1);
    expect(received.mock.calls[0][0].component).toBe(HomeView);
  });

  it('loaderData is undefined when the loader rejects', async () => {
    const r = makeRouter();
    const loader = vi.fn().mockRejectedValue(new Error('fetch failed'));
    r.addRoute('/', { component: HomeView, loader });

    const received = vi.fn();
    r.eventBus.on('router:load-component', received);

    await r.navigateTo('/');

    expect(received.mock.calls[0][0].loaderData).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// addRoute() stores the loader on the route object
// ---------------------------------------------------------------------------

describe('addRoute() — loader storage', () => {
  it('stores the loader on the route config', () => {
    const r = makeRouter();
    const loader = async () => [];
    r.addRoute('/items', { component: HomeView, loader });

    const { route } = r.findRoute('/items');
    expect(route.loader).toBe(loader);
  });

  it('stores null loader when route has no loader', () => {
    const r = makeRouter();
    r.addRoute('/items', HomeView);

    const { route } = r.findRoute('/items');
    expect(route.loader).toBeNull();
  });

  it('stores null loader when config object omits loader', () => {
    const r = makeRouter();
    r.addRoute('/items', { component: HomeView });

    const { route } = r.findRoute('/items');
    expect(route.loader).toBeNull();
  });
});
