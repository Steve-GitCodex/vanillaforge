import { BaseComponent } from 'vanillaforge';
import { UserCard } from './user-card.js';
import { users as initialUsers } from '../data/users.js';

export class UsersList extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'users-list';
    this.state = { users: [...initialUsers] };
  }

  async onInit() {
    this.eventBus.on('user:remove', ({ id }) => {
      this.setState({ users: this.state.users.filter((u) => u.id !== id) });
    });
  }

  getTemplate() {
    const { users } = this.state;

    if (users.length === 0) {
      return `
        <section class="vf-card">
          <h1>People</h1>
          <p class="muted" style="margin-top: 16px;">No users left in the list.</p>
        </section>`;
    }

    return `
      <section class="vf-card">
        <h1>People</h1>
        <p class="muted">
          ${this.icon('info', { size: 14 })}
          Click a name to view the full profile, or use the toggle to expand.
        </p>
        <ul class="user-list">
          ${users.map((u) => this.child(UserCard, { user: u }, u.id)).join('')}
        </ul>
      </section>`;
  }
}
