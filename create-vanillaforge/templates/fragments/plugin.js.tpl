/**
 * {{PluginName}} plugin
 *
 * Install with:
 *   import { {{pluginName}}Plugin } from './plugins/{{plugin-name}}/{{plugin-name}}-plugin.js';
 *   app.use({{pluginName}}Plugin);
 *
 * Access from a component:
 *   const svc = this.service('{{plugin-name}}');
 */

export class {{PluginName}}Service {
  constructor(options = {}) {
    this._options = options;
  }

  // Add your service methods here
}

export const {{pluginName}}Plugin = {
  name: '{{plugin-name}}',

  install(app, options = {}) {
    const service = new {{PluginName}}Service(options);
    app.provide('{{plugin-name}}', service);
  },
};
