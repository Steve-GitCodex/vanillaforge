import { BaseComponent } from 'vanillaforge';
import { getUser } from '../data/users.js';

export class UserDetail extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'user-detail';
  }

  get user() {
    return getUser(this.props.route?.params?.id);
  }

  getTemplate() {
    const user = this.user;

    if (!user) {
      return `
        <section class="vf-card">
          <a class="back-link" href="/">
            ${this.icon('arrow-left', { size: 16 })} Back to people
          </a>
          <h1>Not found</h1>
          <p class="muted" style="margin-top: 8px;">No person with that id.</p>
        </section>`;
    }

    return `
      <section class="vf-card">
        <a class="back-link" href="/">
          ${this.icon('arrow-left', { size: 16 })} Back to people
        </a>
        <div class="detail-header">
          <div class="detail-avatar">${user.name.charAt(0)}</div>
          <div>
            <h1>${user.name}</h1>
            <p class="role">${user.role}</p>
          </div>
        </div>
        <p>${user.bio}</p>
      </section>`;
  }
}
