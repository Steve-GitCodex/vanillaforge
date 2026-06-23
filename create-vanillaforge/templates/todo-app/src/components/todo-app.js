import { BaseComponent } from 'vanillaforge';

export class TodoApp extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'todo-app';
    this.state = {
      todos: this._load(),
      newTodo: '',
      filter: 'all',
    };
  }

  _load() {
    try {
      const saved = localStorage.getItem('vf-todos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem('vf-todos', JSON.stringify(this.state.todos));
    } catch {
      // localStorage unavailable
    }
  }

  _filtered() {
    const { todos, filter } = this.state;
    if (filter === 'active') return todos.filter((t) => !t.done);
    if (filter === 'completed') return todos.filter((t) => t.done);
    return todos;
  }

  _stats() {
    const total = this.state.todos.length;
    const done = this.state.todos.filter((t) => t.done).length;
    return { total, done, active: total - done };
  }

  _esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  getTemplate() {
    const items = this._filtered();
    const stats = this._stats();
    const { filter } = this.state;
    const filterBtn = (f, label) =>
      `<button class="vf-btn ${filter === f ? 'vf-btn-primary' : 'vf-btn-secondary'}"
         style="padding:6px 14px;font-size:.85rem" data-action="setFilter" data-filter="${f}">
         ${label}
       </button>`;

    return `
      <div class="vf-card" style="border-radius:16px;overflow:hidden;box-shadow:var(--vf-shadow-md)">
        <div style="background:linear-gradient(135deg,#1e293b,#0f172a);color:#f8fafc;padding:28px 24px;text-align:center">
          <h1 style="font-size:1.6rem;font-weight:700;letter-spacing:-.02em">Todos</h1>
          <p style="color:#94a3b8;font-size:.9rem;margin-top:4px">Built with VanillaForge</p>
        </div>
        <div style="padding:24px">
          <div style="display:flex;gap:10px;margin-bottom:20px">
            <input type="text"
              class="vf-input"
              style="flex:1;padding:12px;border:2px solid var(--vf-border);border-radius:var(--vf-radius);font-size:1rem"
              placeholder="What needs to be done?"
              value="${this._esc(this.state.newTodo)}"
              data-input="inputChange"
              data-keydown="keyDown">
            <button class="vf-btn vf-btn-primary" data-action="add"
              style="padding:12px 20px">
              ${this.icon('plus', { size: 18 })} Add
            </button>
          </div>

          ${stats.total > 0 ? `
            <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
              ${filterBtn('all', 'All (' + stats.total + ')')}
              ${filterBtn('active', 'Active (' + stats.active + ')')}
              ${filterBtn('completed', 'Done (' + stats.done + ')')}
              ${stats.done > 0 ? `
                <button class="vf-btn vf-btn-danger"
                  style="padding:6px 14px;font-size:.85rem;margin-left:auto"
                  data-action="clearDone">
                  Clear done
                </button>` : ''}
            </div>
          ` : ''}

          ${items.length > 0 ? `
            <ul style="list-style:none">
              ${items.map((t) => `
                <li data-key="${t.id}"
                  style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--vf-radius);
                         margin-bottom:8px;background:${t.done ? 'var(--vf-border)' : 'var(--vf-surface)'}">
                  <input type="checkbox" ${t.done ? 'checked' : ''}
                    data-change="toggle" data-id="${t.id}"
                    style="width:18px;height:18px;cursor:pointer;flex-shrink:0">
                  <span style="flex:1;${t.done ? 'text-decoration:line-through;opacity:.5' : ''}">
                    ${this._esc(t.text)}
                  </span>
                  <button class="vf-btn vf-btn-danger" data-action="remove" data-id="${t.id}"
                    style="padding:4px 10px;font-size:.8rem">
                    ${this.icon('trash', { size: 14 })}
                  </button>
                </li>
              `).join('')}
            </ul>
          ` : `
            <div style="text-align:center;padding:40px;color:var(--vf-text-muted)">
              ${this.icon('check', { size: 40 })}
              <p style="margin-top:12px">
                ${filter === 'active' ? 'No active todos.' : filter === 'completed' ? 'Nothing completed yet.' : 'Add a todo above.'}
              </p>
            </div>
          `}
        </div>
      </div>`;
  }

  getMethods() {
    return {
      inputChange: (e) => this.setState({ newTodo: e.target.value }, false),

      keyDown: (e) => {
        if (e.key === 'Enter') this.getMethods().add();
      },

      add: () => {
        const text = this.state.newTodo.trim();
        if (!text) return;
        const todo = { id: Date.now(), text, done: false };
        this.setState({ todos: [...this.state.todos, todo], newTodo: '' });
        this._save();
      },

      toggle: (e) => {
        const id = Number(e.target.dataset.id);
        const todos = this.state.todos.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t
        );
        this.setState({ todos });
        this._save();
      },

      remove: async (e) => {
        const id = Number(e.target.closest('[data-id]').dataset.id);
        const alerts = this.service('alerts');
        const ok = alerts
          ? await alerts.confirm('Delete this todo?', { danger: true })
          : true;
        if (ok) {
          this.setState({ todos: this.state.todos.filter((t) => t.id !== id) });
          this._save();
        }
      },

      setFilter: (e) => {
        this.setState({ filter: e.target.closest('[data-filter]').dataset.filter });
      },

      clearDone: () => {
        this.setState({ todos: this.state.todos.filter((t) => !t.done) });
        this._save();
      },
    };
  }
}
