import { BaseComponent } from 'vanillaforge';

export class HomeComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'home';
    this.state = { count: 0 };
  }

  getTemplate() {
    return `
      <div style="max-width: 640px; margin: 60px auto; padding: 0 20px;">
        <div class="vf-card" style="padding: 48px; text-align: center;">
          <h1 style="margin-bottom: 8px;">{{PROJECT_NAME}}</h1>
          <p style="color: var(--vf-text-muted); margin-bottom: 40px;">Built with VanillaForge</p>

          <p style="font-size: 3rem; font-weight: 700; line-height: 1; margin-bottom: 24px;">
            ${this.state.count}
          </p>

          <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 40px;">
            <button class="vf-btn vf-btn-secondary" data-action="dec">
              ${this.icon('minus', { size: 16 })} Less
            </button>
            <button class="vf-btn vf-btn-primary" data-action="inc">
              ${this.icon('plus', { size: 16 })} More
            </button>
          </div>

          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="vf-btn vf-btn-success" data-action="showSuccess">
              ${this.icon('check', { size: 15 })} Success
            </button>
            <button class="vf-btn vf-btn-danger" data-action="showError">
              ${this.icon('warning', { size: 15 })} Error
            </button>
            <button class="vf-btn vf-btn-secondary" data-action="reset">
              ${this.icon('info', { size: 15 })} Reset
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getMethods() {
    return {
      inc: () => this.setState({ count: this.state.count + 1 }),
      dec: () => this.setState({ count: this.state.count - 1 }),

      showSuccess: () => this.service('alerts')?.success('Count updated!'),
      showError:   () => this.service('alerts')?.error('Something went wrong.'),

      reset: async () => {
        const ok = await this.service('alerts')?.confirm('Reset the counter to zero?', {
          danger: true,
          confirmText: 'Reset',
        });
        if (ok) this.setState({ count: 0 });
      },
    };
  }
}
