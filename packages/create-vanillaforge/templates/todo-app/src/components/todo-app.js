import { BaseComponent } from 'vanillaforge';

export class TodoApp extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'todo-app';
    this.state = {
      todos: this._load(),
      input: '',
      filter: 'all',
    };
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem('vf-todos') ?? '[]');
    } catch {
      return [];
    }
  }

  _save(todos) {
    try { localStorage.setItem('vf-todos', JSON.stringify(todos)); } catch { /* ignore */ }
  }

  _filtered() {
    const { todos, filter } = this.state;
    if (filter === 'active') return todos.filter((t) => !t.done);
    if (filter === 'completed') return todos.filter((t) => t.done);
    return todos;
  }

  getTemplate() {
    const filtered = this._filtered();
    const total = this.state.todos.length;
    const active = this.state.todos.filter((t) => !t.done).length;
    const completed = total - active;

    return `
      <div style="max-width: 560px; margin: 0 auto;">
        <div class="vf-card" style="overflow: hidden; padding: 0;">

          <div style="background: var(--vf-primary, #3b82f6); color: #fff; padding: 28px 28px 24px;">
            <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">{{PROJECT_NAME}}</h1>
            <p style="opacity: .75; font-size: .9rem;">Built with VanillaForge</p>
          </div>

          <div style="padding: 24px 28px;">

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
              <input
                type="text"
                placeholder="What needs to be done?"
                value="${escapeAttr(this.state.input)}"
                data-input="onInput"
                data-keydown="onKeyDown"
                style="flex: 1; padding: 10px 14px; border: 1px solid var(--vf-border, #e5e7eb);
                       border-radius: var(--vf-radius, 6px); font-size: 15px; outline: none;"
              >
              <button class="vf-btn vf-btn-primary" data-action="add">
                ${this.icon('plus', { size: 16 })} Add
              </button>
            </div>

            ${total > 0 ? `
              <div style="display: flex; gap: 6px; margin-bottom: 16px;">
                ${['all', 'active', 'completed'].map((f) => `
                  <button class="vf-btn ${this.state.filter === f ? 'vf-btn-primary' : 'vf-btn-secondary'}"
                          style="padding: 5px 12px; font-size: 13px;"
                          data-action="setFilter" data-filter="${f}">
                    ${f.charAt(0).toUpperCase() + f.slice(1)}
                    (${f === 'all' ? total : f === 'active' ? active : completed})
                  </button>
                `).join('')}
                ${completed > 0 ? `
                  <button class="vf-btn vf-btn-secondary"
                          style="padding: 5px 12px; font-size: 13px; margin-left: auto;"
                          data-action="clearDone">
                    ${this.icon('trash', { size: 13 })} Clear
                  </button>
                ` : ''}
              </div>
            ` : ''}

            ${filtered.length > 0 ? `
              <ul style="list-style: none;">
                ${filtered.map((todo) => `
                  <li data-key="${todo.id}"
                      style="display: flex; align-items: center; gap: 12px;
                             padding: 12px 0; border-top: 1px solid var(--vf-border, #e5e7eb);">
                    <input type="checkbox" ${todo.done ? 'checked' : ''}
                           data-change="toggle" data-id="${todo.id}"
                           style="width: 17px; height: 17px; cursor: pointer; flex-shrink: 0;">
                    <span style="flex: 1; font-size: 15px; ${todo.done ? 'text-decoration: line-through; opacity: .5;' : ''}">
                      ${escapeHtml(todo.text)}
                    </span>
                    <button class="vf-btn vf-btn-secondary"
                            style="padding: 4px 10px; font-size: 13px;"
                            data-action="remove" data-id="${todo.id}">
                      ${this.icon('trash', { size: 13 })}
                    </button>
                  </li>
                `).join('')}
              </ul>
            ` : `
              <p style="text-align: center; padding: 32px 0; color: var(--vf-text-muted, #7b8794);">
                ${total === 0 ? 'No todos yet. Add one above!' : 'No todos match this filter.'}
              </p>
            `}
          </div>
        </div>
      </div>
    `;
  }

  getMethods() {
    return {
      onInput: (e) => this.setState({ input: e.target.value }, false),

      onKeyDown: (e) => {
        if (e.key === 'Enter') this.getMethods().add();
      },

      add: () => {
        const text = this.state.input.trim();
        if (!text) return;
        const todos = [
          ...this.state.todos,
          { id: Date.now(), text, done: false },
        ];
        this._save(todos);
        this.setState({ todos, input: '' });
      },

      toggle: (e) => {
        const id = Number(e.target.dataset.id);
        const todos = this.state.todos.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t
        );
        this._save(todos);
        this.setState({ todos });
      },

      remove: async (e) => {
        const id = Number(e.target.closest('[data-id]').dataset.id);
        const todo = this.state.todos.find((t) => t.id === id);
        const ok = await this.service('alerts')?.confirm(`Remove "${todo?.text}"?`, { danger: true, confirmText: 'Remove' });
        if (!ok) return;
        const todos = this.state.todos.filter((t) => t.id !== id);
        this._save(todos);
        this.setState({ todos });
      },

      setFilter: (e) => this.setState({ filter: e.target.dataset.filter }),

      clearDone: () => {
        const todos = this.state.todos.filter((t) => !t.done);
        this._save(todos);
        this.setState({ todos });
      },
    };
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
