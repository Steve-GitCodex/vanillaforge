import { BaseComponent, html } from 'vanillaforge';

export class {{ComponentName}}Component extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, props);
    this.name = '{{component-name}}';
    this.state = {};
  }

  // this.props.data is populated by the route loader defined in app.js.
  // If no loader is configured it will be undefined.
  getTemplate() {
    const data = this.props.data;
    if (!data) return html`<div class="{{component-name}}"><p>Loading...</p></div>`;
    return html`
      <div class="{{component-name}}">
        <h2>{{ComponentName}}</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>
    `;
  }

  getMethods() {
    return {};
  }
}
