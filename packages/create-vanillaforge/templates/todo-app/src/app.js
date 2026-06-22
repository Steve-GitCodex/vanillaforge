import { createApp, themePlugin, iconsPlugin, alertsPlugin } from 'vanillaforge';
import { TodoApp } from './components/todo-app.js';

const app = createApp({ appName: '{{PROJECT_NAME}}', mountId: 'app' });

app.use(themePlugin);
app.use(iconsPlugin);
app.use(alertsPlugin);

await app.initialize({ routes: { '/': TodoApp } });
await app.start();
