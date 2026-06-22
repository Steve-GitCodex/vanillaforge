import { BaseComponent } from '../../../src/framework.js';
import { UserCard } from './user-card.js';
import { users } from '../data/users.js';

/**
 * Lists all users using component composition.
 *
 * Each user is rendered as a UserCard child component (this.child()). Each card
 * is keyed by user.id so the framework preserves card state (expanded/collapsed)
 * across parent re-renders. Event delegation is automatically scoped — clicks
 * inside a card are handled by the card, not by this component.
 */
export class UsersList extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'users-list';
  }

  getTemplate() {
    return `
      <section class="card">
        <h1>People</h1>
        <p class="muted">
          ${this.icon('info', { size: 14 })}
          Click a name to view the full profile, or use the toggle to expand.
        </p>
        <ul class="user-list">
          ${users
            .map((u) => this.child(UserCard, { user: u }, u.id))
            .join('')}
        </ul>
      </section>`;
  }
}
