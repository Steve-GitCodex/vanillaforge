import { BaseComponent } from '../../../src/framework.js';

/**
 * A single user card with an expand/collapse toggle.
 *
 * Demonstrates component composition: UsersList embeds one UserCard per user
 * via this.child(UserCard, { user }, user.id). Each card manages its own
 * expanded/collapsed state independently — parent re-renders don't reset it.
 *
 * Props:
 *   user { id, name, role, bio }
 */
export class UserCard extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'user-card';
    this.state = { expanded: false };
  }

  getTemplate() {
    const { user } = this.props;
    const { expanded } = this.state;

    return `
      <li class="user-card" data-expanded="${expanded}">
        <div class="user-card-row">
          <a class="user-card-link" href="/users/${user.id}">
            <div class="user-card-avatar">${user.name.charAt(0)}</div>
            <div>
              <strong class="user-card-name">${user.name}</strong>
              <span class="user-card-role">${user.role}</span>
            </div>
          </a>
          <button class="user-card-toggle" data-action="toggle" title="${expanded ? 'Collapse' : 'Expand'}">
            ${this.icon(expanded ? 'chevron-up' : 'chevron-down', { size: 18 })}
          </button>
        </div>
        ${expanded ? `
          <div class="user-card-bio">
            <p>${user.bio}</p>
            <a class="user-card-detail-link" href="/users/${user.id}">
              Full profile ${this.icon('arrow-right', { size: 14 })}
            </a>
          </div>` : ''}
      </li>`;
  }

  getMethods() {
    return {
      toggle: () => this.setState({ expanded: !this.state.expanded }),
    };
  }
}
