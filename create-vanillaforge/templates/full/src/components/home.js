import { BaseComponent } from 'vanillaforge';

export class HomeComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'home';
    this.state = { count: 0 };
  }

  getTemplate() {
    return `
      <div style="max-width:520px;margin:80px auto;text-align:center">
        <h1 style="margin-bottom:8px">{{project-name}}</h1>
        <p style="color:var(--vf-text-muted);margin-bottom:32px">
          Count: <strong>${this.state.count}</strong>
        </p>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="vf-btn vf-btn-primary" data-action="increment">
            ${this.icon('plus', { size: 16 })} Increment
          </button>
          <button class="vf-btn vf-btn-secondary" data-action="showInfo">
            ${this.icon('info', { size: 16 })} Info
          </button>
          <button class="vf-btn vf-btn-danger" data-action="reset">
            ${this.icon('close', { size: 16 })} Reset
          </button>
        </div>
      </div>`;
  }

  getMethods() {
    return {
      increment: () => this.setState({ count: this.state.count + 1 }),

      reset: async () => {
        const alerts = this.service('alerts');
        const ok = await alerts.confirm('Reset the counter to zero?', { danger: true });
        if (ok) {
          this.setState({ count: 0 });
          alerts.success('Counter reset.');
        }
      },

      showInfo: () => {
        this.service('alerts').info(
          'Built with VanillaForge — icons, theme, alerts, and fonts, zero external dependencies.'
        );
      },
    };
  }
}
