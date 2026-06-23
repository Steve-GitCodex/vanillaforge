import { BaseComponent } from 'vanillaforge';

export class UserCard extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, props);
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
          <div class="user-card-actions">
            <button class="user-card-toggle" data-action="toggle"
              title="${expanded ? 'Collapse' : 'Expand'}">
              ${this.icon(expanded ? 'chevron-up' : 'chevron-down', { size: 18 })}
            </button>
            <button class="user-card-remove" data-action="remove"
              title="Remove ${user.name}">
              ${this.icon('trash', { size: 15 })}
            </button>
          </div>
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

      remove: () => {
        const { user } = this.props;
        const alerts = this.service('alerts');
        if (!alerts) return;
        alerts.confirm(`Remove ${user.name} from the list?`, {
          title: 'Remove user',
          confirmText: 'Remove',
          danger: true,
          onConfirm: () => {
            alerts.success(`${user.name} removed`);
            this.eventBus.emit('user:remove', { id: user.id });
          },
        });
      },
    };
  }
}
