import { describe, it, expect, beforeEach } from 'vitest';
import { BaseComponent } from '../src/components/base-component.js';
import { EventBus } from '../src/core/event-bus.js';

/** A minimal component exercising state, templates, and delegated actions. */
class Counter extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'counter';
    this.state = { count: 0 };
  }
  getTemplate() {
    return `<button data-action="inc">+</button><span class="v">${this.state.count}</span>`;
  }
  getMethods() {
    return { inc: () => this.setState({ count: this.state.count + 1 }) };
  }
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function mountComponent(ComponentClass, props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const instance = new ComponentClass(new EventBus(), props);
  instance.container = container;
  return instance;
}

describe('BaseComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders once into a stable wrapper element', async () => {
    const c = mountComponent(Counter);
    await c.init();
    expect(c.element).toBeTruthy();
    expect(c.element.classList.contains('counter')).toBe(true);
    expect(c.querySelector('.v').textContent).toBe('0');
    expect(c.container.children).toHaveLength(1); // one wrapper, not double-rendered
  });

  it('morphs on setState and keeps the same wrapper element', async () => {
    const c = mountComponent(Counter);
    await c.init();
    const wrapper = c.element;
    await c.setState({ count: 5 });
    expect(c.element).toBe(wrapper); // stable across re-render
    expect(c.querySelector('.v').textContent).toBe('5');
  });

  it('dispatches a delegated action exactly once per click', async () => {
    const c = mountComponent(Counter);
    await c.init();
    c.querySelector('button').click();
    await flush();
    c.querySelector('button').click();
    await flush();
    expect(c.state.count).toBe(2); // not 4 — no double binding
    expect(c.querySelector('.v').textContent).toBe('2');
  });

  it('removes delegated listeners on destroy', async () => {
    const c = mountComponent(Counter);
    await c.init();
    const button = c.querySelector('button');
    c.destroy();
    button.click();
    await flush();
    expect(c.state.count).toBe(0);
    expect(c.isDestroyed).toBe(true);
  });

  it('throws when rendering a destroyed component', async () => {
    const c = mountComponent(Counter);
    await c.init();
    c.destroy();
    await expect(c.render()).rejects.toThrow(/destroyed/);
  });
});
