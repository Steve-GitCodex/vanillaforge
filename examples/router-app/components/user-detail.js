import { BaseComponent } from '../../../src/framework.js';
import { getUser } from '../data/users.js';

/**
 * Shows a single user. The id comes from the matched route's params, which the
 * router passes to the component as props.route.params.
 */
export class UserDetail extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'user-detail';
  }

  get user() {
    const id = this.props.route?.params?.id;
    return getUser(id);
  }

  getTemplate() {
    const user = this.user;
    if (!user) {
      return `
        <section class="card">
          <h1>Not found</h1>
          <p class="muted">No person with that id.</p>
          <a class="btn" href="/">
            ${this.icon('arrow-left', { size: 16 })} Back to people
          </a>
        </section>`;
    }

    return `
      <section class="card">
        <a class="btn" href="/">
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
