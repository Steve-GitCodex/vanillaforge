import {
  createApp,
  iconsPlugin,
  themePlugin,
  alertsPlugin,
  fontsPlugin,
} from 'vanillaforge';
import { HomeComponent } from './components/home.js';

const app = createApp({ appName: '{{project-name}}' });

app.use(themePlugin, {
  tokens: { primary: '#3b82f6', radius: '8px' },
});
app.use(iconsPlugin);
app.use(alertsPlugin);
app.use(fontsPlugin, { families: ['Inter'] });

await app.initialize({
  routes: { '/': HomeComponent },
  components: { home: HomeComponent },
});

await app.start();
