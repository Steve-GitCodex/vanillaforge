import { createApp, BaseComponent } from 'vanillaforge';

class HomeComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, { autoLoadCSS: false, ...props });
    this.name = 'home';
    this.state = { count: 0 };
  }

  getTemplate() {
    return `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; text-align: center; padding: 0 20px;">
        <h1 style="margin-bottom: 8px;">{{PROJECT_NAME}}</h1>
        <p style="color: #6b7280; margin-bottom: 40px;">Built with VanillaForge</p>
        <p style="font-size: 3rem; font-weight: 700; line-height: 1; margin-bottom: 24px;">${this.state.count}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button data-action="dec"
            style="padding: 10px 24px; font-size: 18px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; background: #f9fafb;">
            -
          </button>
          <button data-action="inc"
            style="padding: 10px 24px; font-size: 18px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; background: #f9fafb;">
            +
          </button>
        </div>
      </div>
    `;
  }

  getMethods() {
    return {
      inc: () => this.setState({ count: this.state.count + 1 }),
      dec: () => this.setState({ count: this.state.count - 1 }),
    };
  }
}

const app = createApp({ appName: '{{PROJECT_NAME}}', mountId: 'app' });
await app.initialize({ routes: { '/': HomeComponent } });
await app.start();
