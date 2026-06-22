import { createApp, themePlugin, iconsPlugin, alertsPlugin } from 'vanillaforge';
import { UsersList } from './components/users-list.js';
import { UserDetail } from './components/user-detail.js';

const app = createApp({ appName: '{{PROJECT_NAME}}' });

app.use(themePlugin);
app.use(iconsPlugin);
app.use(alertsPlugin);

await app.initialize({
  routes: {
    '/': UsersList,
    '/users/:id': UserDetail,
  },
});

await app.start();
