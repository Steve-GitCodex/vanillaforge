import { createApp, iconsPlugin, themePlugin, alertsPlugin, fontsPlugin } from 'vanillaforge';
import { HomeComponent } from './components/home.js';

const app = createApp({ appName: '{{PROJECT_NAME}}', mountId: 'app' });

app.use(themePlugin);
app.use(iconsPlugin);
app.use(alertsPlugin);
app.use(fontsPlugin, { families: ['Inter'] });

await app.initialize({ routes: { '/': HomeComponent } });
await app.start();
