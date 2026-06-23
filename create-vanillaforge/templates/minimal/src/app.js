import { createApp, BaseComponent } from 'vanillaforge';

class HomeComponent extends BaseComponent {
  constructor(eventBus, props) {
    super(eventBus, props);
    this.name = 'home';
    this.state = { count: 0 };
  }

  getTemplate() {
    return `
      <div style="font-family:system-ui;max-width:480px;margin:80px auto;text-align:center">
        <h1>${this.app?.config?.appName ?? 'VanillaForge'}</h1>
        <p style="color:#666;margin-bottom:32px">Count: <strong>${this.state.count}</strong></p>
        <button data-action="increment"
          style="padding:10px 24px;border:none;border-radius:6px;background:#3b82f6;color:#fff;cursor:pointer;font-size:1rem">
          Increment
        </button>
      </div>`;
  }

  getMethods() {
    return {
      increment: () => this.setState({ count: this.state.count + 1 }),
    };
  }
}

const app = createApp({ appName: '{{project-name}}' });

await app.initialize({
  routes: { '/': HomeComponent },
});

await app.start();
