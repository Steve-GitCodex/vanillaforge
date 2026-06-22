import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from '../src/core/router.js';
import { EventBus } from '../src/core/event-bus.js';

class HomeView {}
class UserView {}
class NotFoundView {}

function makeRouter(config = {}) {
  return new Router(new EventBus(), undefined, undefined, config);
}

describe('Router.matchesRoute', () => {
  const r = makeRouter();

  it('matches static paths', () => {
    expect(r.matchesRoute('/home', '/home').isMatch).toBe(true);
    expect(r.matchesRoute('/home', '/about').isMatch).toBe(false);
  });

  it('matches and extracts params', () => {
    const { isMatch, params } = r.matchesRoute('/users/42', '/users/:id');
    expect(isMatch).toBe(true);
    expect(params).toEqual({ id: '42' });
  });

  it('rejects mismatched segment counts', () => {
    expect(r.matchesRoute('/users/42/extra', '/users/:id').isMatch).toBe(false);
  });
});

describe('Router navigation', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('loads the component for a matched route', async () => {
    const r = makeRouter();
    r.addRoute('/', HomeView);
    const loaded = vi.fn();
    r.eventBus.on('router:load-component', loaded);

    await r.navigateTo('/');
    expect(loaded).toHaveBeenCalledTimes(1);
    expect(loaded.mock.calls[0][0].component).toBe(HomeView);
  });

  it('passes route params to the loaded component', async () => {
    const r = makeRouter();
    r.addRoute('/users/:id', UserView);
    const loaded = vi.fn();
    r.eventBus.on('router:load-component', loaded);

    await r.navigateTo('/users/7');
    expect(loaded.mock.calls[0][0].route.params).toEqual({ id: '7' });
  });

  it('falls back to the configured route on no match', async () => {
    const r = makeRouter({ fallback: '/404' });
    r.addRoute('/', HomeView);
    r.addRoute('/404', NotFoundView);
    const loaded = vi.fn();
    r.eventBus.on('router:load-component', loaded);

    await r.navigateTo('/does-not-exist');
    expect(loaded).toHaveBeenCalledTimes(1);
    expect(loaded.mock.calls[0][0].component).toBe(NotFoundView);
  });

  it('does not loop when the fallback route itself is missing', async () => {
    const r = makeRouter({ fallback: '/404' });
    r.addRoute('/', HomeView);
    const notFound = vi.fn();
    r.eventBus.on('router:not-found', notFound);

    await expect(r.navigateTo('/nope')).resolves.toBeUndefined();
    expect(notFound).toHaveBeenCalled();
  });

  it('navigates when asked over the event bus', async () => {
    const r = makeRouter();
    r.addRoute('/', HomeView);
    r.addRoute('/about', HomeView);
    r.setupEventListeners();
    const loaded = vi.fn();
    r.eventBus.on('router:load-component', loaded);

    r.eventBus.emit('router:navigate', '/about');
    await new Promise((res) => setTimeout(res, 0));
    expect(loaded).toHaveBeenCalled();
  });
});
