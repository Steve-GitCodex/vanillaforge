import { createApp, iconsPlugin, themePlugin, alertsPlugin } from 'vanillaforge';
import { UsersList } from './components/users-list.js';
import { UserDetail } from './components/user-detail.js';

const basePath = window.location.pathname
  .replace(/\/[^/]*\.[^/]*$/, '')
  .replace(/\/$/, '');

const app = createApp({
  appName: '{{project-name}}',
  router: { basePath },
});

app.use(themePlugin, { tokens: { primary: '#3b82f6', radius: '8px' } });
app.use(iconsPlugin);
app.use(alertsPlugin);

await app.initialize({
  routes: {
    '/': UsersList,
    '/users/:id': UserDetail,
  },
});

await app.start();
