import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentManager } from '../src/core/component-manager.js';
import { BaseComponent } from '../src/components/base-component.js';
import { EventBus } from '../src/core/event-bus.js';

class Hello extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'hello';
  }
  getTemplate() {
    return `<h1>Hello</h1>`;
  }
}

function makeManager() {
  document.body.innerHTML = '<div id="main-content"></div>';
  return new ComponentManager(new EventBus());
}

describe('ComponentManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('registers and lists components', () => {
    const m = makeManager();
    m.registerComponent('hello', Hello);
    expect(m.getRegisteredComponents()).toContain('hello');
  });

  it('loads a component once (no double render)', async () => {
    const m = makeManager();
    m.registerComponent('hello', Hello);
    await m.loadComponent('hello');

    const container = document.getElementById('main-content');
    expect(container.children).toHaveLength(1);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(m.getActiveComponents().size).toBe(1);
  });

  it('replaces the previous component when loading into the same container', async () => {
    const m = makeManager();
    m.registerComponent('hello', Hello);
    await m.loadComponentClass(Hello);
    await m.loadComponentClass(Hello);

    const container = document.getElementById('main-content');
    expect(container.children).toHaveLength(1); // old one unloaded first
    expect(m.getActiveComponents().size).toBe(1);
  });

  it('throws a clear error when the mount container is missing', async () => {
    document.body.innerHTML = ''; // no #main-content
    const m = new ComponentManager(new EventBus());
    await expect(m.loadComponentClass(Hello)).rejects.toThrow(/Container not found/);
  });

  it('honours a custom mountId', async () => {
    document.body.innerHTML = '<div id="app-root"></div>';
    const m = new ComponentManager(new EventBus(), undefined, undefined, { mountId: 'app-root' });
    await m.loadComponentClass(Hello);
    expect(document.getElementById('app-root').querySelectorAll('h1')).toHaveLength(1);
  });
});
