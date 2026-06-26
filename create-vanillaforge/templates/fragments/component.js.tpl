import { BaseComponent } from 'vanillaforge';

export class {{ComponentName}}Component extends BaseComponent {
  constructor(eventBus, props = {}) {
    super(eventBus, props);
    this.name = '{{component-name}}';
    this.state = {};
  }

  getTemplate() {
    return `
      <div class="{{component-name}}">
        <h2>{{ComponentName}}</h2>
      </div>
    `;
  }

  getMethods() {
    return {};
  }
}
