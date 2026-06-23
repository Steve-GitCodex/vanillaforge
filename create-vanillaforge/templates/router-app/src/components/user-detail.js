import { BaseComponent } from 'vanillaforge';

export class UserDetail extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, props);
    this.name = 'user-detail';
  }

  get user() {
    return this.props.data ?? null;
  }

  getTemplate() {
    const user = this.user;

    if (!user) {
      return `
        <section class="vf-card">
          <h1>Not found</h1>
          <p class="muted">No person with that id.</p>
          <a class="back-link" href="/">
            ${this.icon('arrow-left', { size: 16 })} Back to people
          </a>
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
            <p style="color:var(--vf-primary);font-weight:600;margin-top:2px">${user.role}</p>
          </div>
        </div>
        <p>${user.bio}</p>
      </section>`;
  }
}
