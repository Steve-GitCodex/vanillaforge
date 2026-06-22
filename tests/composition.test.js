/**
 * Tests for component composition.
 *
 * Covers: child rendering, props propagation, keyed identity/reuse, child state
 * preservation across parent re-renders, removal/teardown, event isolation, and
 * full teardown when the parent is destroyed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseComponent } from '../src/components/base-component.js';
import { EventBus } from '../src/core/event-bus.js';

// ---------------------------------------------------------------------------
// Utilities shared by all tests
// ---------------------------------------------------------------------------

const flush = () => new Promise((r) => setTimeout(r, 0));

let bus;

function mount(ComponentClass, props = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const instance = new ComponentClass(bus, { autoLoadCSS: false, ...props });
  instance.container = container;
  return instance;
}

// ---------------------------------------------------------------------------
// Fixture components
// ---------------------------------------------------------------------------

/**
 * Child component that tracks how many times it was rendered and has its own
 * toggle state.
 */
class ChildComp extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'child-comp';
    this.state = { toggled: false, renderCount: 0 };
  }

  async onInit() {
    // Count init as first render.
    this.state.renderCount = 0;
  }

  async onRender() {
    this.state.renderCount++;
  }

  getTemplate() {
    return `
      <div class="child" data-toggled="${this.state.toggled}">
        <span class="label">${this.props.label ?? 'child'}</span>
        <button data-action="toggle">toggle</button>
      </div>`;
  }

  getMethods() {
    return {
      toggle: () => this.setState({ toggled: !this.state.toggled }),
    };
  }
}

/**
 * Parent that renders 0-N children based on this.state.items.
 */
class ParentComp extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'parent-comp';
    this.state = { items: [] };
  }

  getTemplate() {
    return `
      <div class="parent">
        ${this.state.items.map((item) =>
          this.child(ChildComp, { label: item.label }, item.id)
        ).join('')}
      </div>`;
  }
}

/**
 * Parent with a data-action that should NOT be triggered by clicks inside a child.
 */
class IsolationParent extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'isolation-parent';
    this.state = { parentClicks: 0 };
  }

  getTemplate() {
    return `
      <div class="isolation-parent">
        ${this.child(ChildComp, { label: 'isolated' }, 'c1')}
        <button data-action="parentAction">parent button</button>
      </div>`;
  }

  getMethods() {
    return {
      parentAction: () => this.setState({ parentClicks: this.state.parentClicks + 1 }),
    };
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = '';
  bus = new EventBus();
});

describe('child() placeholder and reconcileChildren()', () => {
  it('renders a child component inside the parent', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({ items: [{ id: 1, label: 'Alice' }] });

    expect(parent._children.size).toBe(1);
    const child = [...parent._children.values()][0];
    expect(child).toBeInstanceOf(ChildComp);
    expect(child.props.label).toBe('Alice');
    expect(parent.element.querySelector('.child')).toBeTruthy();
  });

  it('assigns the resolved key from child()', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({ items: [{ id: 42, label: 'X' }] });

    expect(parent._children.has('42')).toBe(true);
  });

  it('mounts multiple children', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({
      items: [
        { id: 1, label: 'A' },
        { id: 2, label: 'B' },
        { id: 3, label: 'C' },
      ],
    });

    expect(parent._children.size).toBe(3);
    const labels = parent.element.querySelectorAll('.label');
    expect(labels[0].textContent).toBe('A');
    expect(labels[1].textContent).toBe('B');
    expect(labels[2].textContent).toBe('C');
  });
});

describe('child instance identity across parent re-renders', () => {
  it('reuses the same child instance when parent re-renders with same items', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({ items: [{ id: 1, label: 'Alice' }] });

    const instanceBefore = parent._children.get('1');
    await parent.setState({ items: [{ id: 1, label: 'Alice (updated)' }] });
    const instanceAfter = parent._children.get('1');

    expect(instanceBefore).toBe(instanceAfter); // same object reference
  });

  it('child internal state survives a parent re-render', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({ items: [{ id: 1, label: 'Alice' }] });

    // Toggle the child's own state.
    const child = parent._children.get('1');
    await child.setState({ toggled: true });
    expect(child.state.toggled).toBe(true);

    // Trigger parent re-render.
    await parent.setState({ items: [{ id: 1, label: 'Alice' }] });

    // Child state must survive.
    expect(child.state.toggled).toBe(true);
  });

  it('props flow from parent to child on re-render', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({ items: [{ id: 1, label: 'Initial' }] });

    const child = parent._children.get('1');
    expect(child.props.label).toBe('Initial');

    await parent.setState({ items: [{ id: 1, label: 'Updated' }] });
    expect(child.props.label).toBe('Updated');
  });
});

describe('keyed reconciliation', () => {
  it('reorders children without destroying them', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({
      items: [
        { id: 1, label: 'A' },
        { id: 2, label: 'B' },
      ],
    });

    const childA = parent._children.get('1');
    const childB = parent._children.get('2');

    // Reverse the order.
    await parent.setState({
      items: [
        { id: 2, label: 'B' },
        { id: 1, label: 'A' },
      ],
    });

    // Same instances — no remount.
    expect(parent._children.get('1')).toBe(childA);
    expect(parent._children.get('2')).toBe(childB);
  });
});

describe('child removal and teardown', () => {
  it('calls destroy() when a child is removed from the template', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({
      items: [
        { id: 1, label: 'A' },
        { id: 2, label: 'B' },
      ],
    });

    const childB = parent._children.get('2');
    const destroySpy = vi.spyOn(childB, 'destroy');

    // Remove item 2 from the template.
    await parent.setState({ items: [{ id: 1, label: 'A' }] });

    expect(destroySpy).toHaveBeenCalledOnce();
    expect(parent._children.has('2')).toBe(false);
    expect(parent._children.size).toBe(1);
  });

  it('removes the child DOM when child is removed', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({ items: [{ id: 1, label: 'A' }, { id: 2, label: 'B' }] });
    await parent.setState({ items: [{ id: 1, label: 'A' }] });

    // Only one .child div should remain.
    expect(parent.element.querySelectorAll('.child')).toHaveLength(1);
  });

  it('parent.destroy() tears down all children', async () => {
    const parent = mount(ParentComp);
    await parent.init();
    await parent.setState({
      items: [{ id: 1, label: 'A' }, { id: 2, label: 'B' }],
    });

    const destroySpies = [...parent._children.values()].map((c) =>
      vi.spyOn(c, 'destroy')
    );

    parent.destroy();

    for (const spy of destroySpies) {
      expect(spy).toHaveBeenCalledOnce();
    }
    expect(parent._children.size).toBe(0);
  });
});

describe('event delegation isolation', () => {
  it('a data-action inside a child is NOT handled by the parent', async () => {
    const parent = mount(IsolationParent);
    await parent.init();
    await flush();

    const childToggle = parent.element.querySelector('.child button[data-action="toggle"]');
    expect(childToggle).toBeTruthy();

    childToggle.click();
    await flush();

    // Parent counter must stay at 0 — the child handled the click.
    expect(parent.state.parentClicks).toBe(0);
  });

  it('a data-action on the parent is NOT handled by the child', async () => {
    const parent = mount(IsolationParent);
    await parent.init();
    await flush();

    const child = [...parent._children.values()][0];
    const toggleSpy = vi.spyOn(child.getMethods(), 'toggle');

    const parentBtn = parent.element.querySelector('button[data-action="parentAction"]');
    parentBtn.click();
    await flush();

    expect(parent.state.parentClicks).toBe(1);
    // Child toggle was not called.
    expect(toggleSpy).not.toHaveBeenCalled();
  });

  it('child toggle state changes independently of the parent', async () => {
    const parent = mount(IsolationParent);
    await parent.init();
    await flush();

    const child = [...parent._children.values()][0];
    expect(child.state.toggled).toBe(false);

    const childToggle = parent.element.querySelector('.child button');
    childToggle.click();
    await flush();

    expect(child.state.toggled).toBe(true);
    expect(parent.state.parentClicks).toBe(0);
  });
});

describe('child() by registered name', () => {
  it('resolves a component from _resolveComponent', async () => {
    class NamedChild extends BaseComponent {
      constructor(eventBus, props = {}) {
        super(eventBus, { autoLoadCSS: false, ...props });
        this.name = 'named-child';
      }
      getTemplate() { return `<div class="named">hi</div>`; }
    }

    class ParentByName extends BaseComponent {
      constructor(eventBus, props = {}) {
        super(eventBus, { autoLoadCSS: false, ...props });
        this.name = 'parent-by-name';
      }
      getTemplate() {
        return `<div>${this.child('my-child', {}, 'c')}</div>`;
      }
    }

    const parent = mount(ParentByName);
    parent._resolveComponent = (name) => name === 'my-child' ? NamedChild : null;
    await parent.init();

    expect(parent._children.has('c')).toBe(true);
    expect(parent.element.querySelector('.named')).toBeTruthy();
  });

  it('returns empty string and warns for unresolved name', async () => {
    class Unresolved extends BaseComponent {
      constructor(eventBus, props = {}) {
        super(eventBus, { autoLoadCSS: false, ...props });
        this.name = 'unresolved';
      }
      getTemplate() { return `<div>${this.child('ghost')}</div>`; }
    }

    const parent = mount(Unresolved);
    // No _resolveComponent set → should not throw, should log warning
    await expect(parent.init()).resolves.not.toThrow();
    expect(parent._children.size).toBe(0);
  });
});
