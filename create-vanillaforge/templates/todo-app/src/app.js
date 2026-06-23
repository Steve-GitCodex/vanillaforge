import { createApp, themePlugin, iconsPlugin, alertsPlugin } from 'vanillaforge';
import { TodoApp } from './components/todo-app.js';

const app = createApp({ appName: '{{project-name}}' });

app.use(themePlugin);
app.use(iconsPlugin);
app.use(alertsPlugin);

await app.initialize({
  routes: { '/': TodoApp },
  components: { 'todo-app': TodoApp },
});

await app.start();
