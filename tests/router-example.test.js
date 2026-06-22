import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../src/core/event-bus.js';
import { UsersList } from '../examples/router-app/components/users-list.js';
import { UserDetail } from '../examples/router-app/components/user-detail.js';

function mount(ComponentClass, props) {
  document.body.innerHTML = '<div id="main-content"></div>';
  const instance = new ComponentClass(new EventBus(), props);
  instance.container = document.getElementById('main-content');
  return instance;
}

describe('Router example components', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('UsersList renders a link per user with the detail route', async () => {
    const c = mount(UsersList);
    await c.init();
    const links = c.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(4);
    expect(links[0].getAttribute('href')).toBe('/users/1');
  });

  it('UserDetail resolves the user from route params', async () => {
    const c = mount(UserDetail, { route: { params: { id: 2 } } });
    await c.init();
    expect(c.element.textContent).toContain('Alan Turing');
  });

  it('UserDetail shows a not-found state for an unknown id', async () => {
    const c = mount(UserDetail, { route: { params: { id: 999 } } });
    await c.init();
    expect(c.element.textContent).toContain('Not found');
  });
});
