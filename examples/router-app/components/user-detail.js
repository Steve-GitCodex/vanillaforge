import { BaseComponent } from '../../../src/framework.js';
import { getUser } from '../data/users.js';

/**
 * Shows a single user. The id comes from the matched route's params, which the
 * router passes to the component as `props.route.params`.
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
          <a class="btn" href="/">← Back to people</a>
        </section>`;
    }

    return `
      <section class="card">
        <a class="btn" href="/">← Back to people</a>
        <h1>${user.name}</h1>
        <p class="role">${user.role}</p>
        <p>${user.bio}</p>
      </section>
    `;
  }
}
