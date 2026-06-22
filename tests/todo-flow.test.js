import { describe, it, expect, beforeEach } from 'vitest';
import { BaseComponent } from '../src/components/base-component.js';
import { EventBus } from '../src/core/event-bus.js';

/**
 * A trimmed-down version of the Todo example that uses the same declarative
 * conventions (data-action / data-change / data-input / data-keydown + keyed
 * list items). This guards the example's interaction model end-to-end.
 */
class TodoList extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'todo';
    this.state = { todos: [], draft: '' };
  }
  getTemplate() {
    return `
      <input class="new" value="${this.state.draft}" data-input="onInput" data-keydown="onKey" />
      <button data-action="add">Add</button>
      <ul>
        ${this.state.todos
          .map(
            (t) => `<li data-key="${t.id}" class="${t.done ? 'done' : ''}">
              <input type="checkbox" ${t.done ? 'checked' : ''} data-change="toggle" data-id="${t.id}" />
              <span>${t.text}</span>
            </li>`
          )
          .join('')}
      </ul>`;
  }
  getMethods() {
    return {
      onInput: (e) => this.setState({ draft: e.target.value }, false),
      onKey: (e) => {
        if (e.key === 'Enter') this.getMethods().add();
      },
      add: () => {
        const text = this.state.draft.trim();
        if (!text) return;
        this.setState({
          todos: [...this.state.todos, { id: this.state.todos.length + 1, text, done: false }],
          draft: '',
        });
      },
      toggle: (e) => {
        const id = Number(e.target.dataset.id);
        this.setState({
          todos: this.state.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        });
      },
    };
  }
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Todo example flow', () => {
  let c;
  beforeEach(async () => {
    document.body.innerHTML = '<div id="main-content"></div>';
    c = new TodoList(new EventBus());
    c.container = document.getElementById('main-content');
    await c.init();
  });

  it('adds todos and clears the input', async () => {
    const input = c.querySelector('.new');
    input.value = 'Buy milk';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    c.querySelector('button').click();
    await flush();

    expect(c.querySelectorAll('li')).toHaveLength(1);
    expect(c.querySelector('li span').textContent).toBe('Buy milk');
    expect(c.querySelector('.new').value).toBe('');
  });

  it('toggles a todo via the checkbox change event', async () => {
    c.setState({ todos: [{ id: 1, text: 'A', done: false }] });
    await flush();
    const box = c.querySelector('input[type="checkbox"]');
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    await flush();
    expect(c.state.todos[0].done).toBe(true);
    expect(c.querySelector('li').classList.contains('done')).toBe(true);
  });

  it('keeps existing list-item nodes stable when a new todo is added', async () => {
    c.setState({ todos: [{ id: 1, text: 'A', done: false }] });
    await flush();
    const firstLi = c.querySelector('[data-key="1"]');

    c.setState({ todos: [...c.state.todos, { id: 2, text: 'B', done: false }] });
    await flush();

    expect(c.querySelector('[data-key="1"]')).toBe(firstLi); // reused, not rebuilt
    expect(c.querySelectorAll('li')).toHaveLength(2);
  });
});
