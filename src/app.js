import { createApp } from './framework.js';
import { HomeComponent } from './components/home-component.js';
import { NotFoundComponent } from './components/not-found-component.js';

async function initializeApp() {
  try {
    // Detect if running on GitHub Pages and set base path
    const isGitHubPages = window.location.hostname.includes('github.io');
    const basePath = isGitHubPages ? '/vanillaforge' : '';

    const app = createApp({
      appName: 'VanillaForge Demo',
      debug: true,
      router: {
        mode: 'history',
        fallback: '/404',
        basePath: basePath,
      },
    });    await app.initialize({
      routes: {
        '/': HomeComponent,
        '/home': HomeComponent,
        '/404': NotFoundComponent,
      },
      components: {
        'home-component': HomeComponent,
        'not-found-component': NotFoundComponent,
      },    });
    await app.start();

    // Handle redirect parameter from GitHub Pages 404
    if (isGitHubPages) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect');
      if (redirectPath && app.router) {
        // Clean up the URL and navigate to the intended path
        window.history.replaceState(null, '', window.location.pathname);
        app.router.navigateTo(redirectPath);
      }
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('VanillaForge application started!');
      console.log('Framework instance available at window.app');
      console.log('Debug tools available at window.VanillaForgeDebug');
    }

    window.app = app;
  } catch (error) {
    console.error('Failed to initialize VanillaForge app:', error);
    const mount = document.getElementById('main-content');
    if (mount) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'padding:40px;text-align:center;color:#dc3545';

      const heading = document.createElement('h2');
      heading.textContent = 'Failed to Load';

      const msg = document.createElement('p');
      msg.textContent = `Error: ${error.message}`;

      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Retry';
      retryBtn.style.cssText = 'padding:10px 20px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:20px';
      retryBtn.addEventListener('click', () => window.location.reload());

      wrapper.append(heading, msg, retryBtn);
      mount.innerHTML = '';
      mount.appendChild(wrapper);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}