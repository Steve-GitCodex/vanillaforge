import { BaseComponent } from '../../../src/framework.js';
import { users } from '../data/users.js';

/**
 * Lists all users. Each row links to a parameterised detail route
 * (`/users/:id`); the framework's router intercepts the link clicks and
 * navigates without a full page reload.
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
        <p class="muted">Click a person to see their details (route params in action).</p>
        <ul class="list">
          ${users
            .map(
              (u) => `
            <li data-key="${u.id}">
              <a href="/users/${u.id}">
                <strong>${u.name}</strong>
                <span class="muted">${u.role}</span>
              </a>
            </li>`
            )
            .join('')}
        </ul>
      </section>
    `;
  }
}
