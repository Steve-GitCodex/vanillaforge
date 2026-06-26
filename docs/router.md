# 🗺️ Routing

*URL routing and navigation*

## What is Routing?

Routing is what makes single-page applications feel like they have multiple pages. It connects URLs (like `/about` or `/users/123`) to specific components. When someone visits a URL or clicks a link, VanillaForge shows the right component without reloading the entire page.

For example:
- `/` might show your HomePage component
- `/about` might show your AboutPage component  
- `/users/123` might show a UserProfile component for user #123

## Basic Routing

You define routes when initializing your app. Each route maps a URL pattern to a component:

```javascript
await app.initialize({
    routes: {
        '/': HomeComponent,           // Show HomeComponent at the root URL
        '/about': AboutComponent,     // Show AboutComponent when URL is /about
        '/contact': ContactComponent  // Show ContactComponent when URL is /contact
    }
});
```

When someone visits `yoursite.com/about`, VanillaForge will automatically create and display the AboutComponent.

## Dynamic Routes

Sometimes you want URLs that contain variable information, like user IDs or post titles. Dynamic routes use `:` to mark variable parts:

```javascript
await app.initialize({
    routes: {
        '/users/:id': UserComponent,           // Matches /users/123, /users/456, etc.
        '/posts/:slug': PostComponent,         // Matches /posts/my-first-post, etc.
        '/shop/:category/:item': ProductComponent  // Matches /shop/shoes/sneakers, etc.
    }
});

// Access the variables in your component
class UserComponent extends BaseComponent {
    async onInit() {
        // Get the ID from the matched route
        const userId = this.props.route?.params?.id; // If URL is /users/123, this is '123'

        // Use it to load data
        this.state.user = await fetchUser(userId);
    }

    getTemplate() {
        if (!this.state.user) return '<div>Loading…</div>';
        return `
            <div class="user-profile">
                <h1>User: ${escapeHtml(this.state.user.name)}</h1>
                <p>User ID: ${escapeHtml(this.props.route.params.id)}</p>
            </div>
        `;
    }
}
```

> **Params are URL-decoded.** The router runs `decodeURIComponent` on every
> dynamic segment, so `/users/John%20Doe` gives `params.id === 'John Doe'`.
> Always escape params before interpolating them into templates — use
> `escapeHtml()` or the `html` tagged template (see the
> [Components — Escaping and XSS](components.md#escaping-and-xss) section).

## Navigation

There are two ways to navigate between pages in your app:

### Programmatic Navigation
Navigate from your JavaScript code:

```javascript
// Go to a different page
app.navigate('/about');

// Go to a user profile  
app.navigate('/users/123');

// Replace current page (doesn't add to browser history)
app.navigate('/dashboard', { replace: true });
```

### Link Navigation
Create clickable links in your HTML. Add `data-navigate` to make VanillaForge handle the link without reloading the page:

```javascript
class NavigationComponent extends BaseComponent {
    render() {
        return `
            <nav>
                <a href="/" data-navigate>Home</a>
                <a href="/about" data-navigate>About</a>
                <a href="/contact" data-navigate>Contact</a>
            </nav>
        `;
    }
}
```

## Navigation Guards

Navigation guards let you intercept navigation before (or after) it happens. Use
them for auth checks, role-based access, loading indicators, and analytics.

### Global guards

Register a global guard with `app.router.beforeNavigation()`. The callback runs
before **every** navigation and must return `true` to allow it or `false` to
cancel it. Async guards are fully supported.

```javascript
// Auth guard — redirect unauthenticated users to /login
app.router.beforeNavigation(async (route, path) => {
  const isLoggedIn = await checkAuth(); // async is fine

  if (!isLoggedIn && path !== '/login') {
    app.navigate('/login');
    return false; // cancel the original navigation
  }

  return true; // allow
});

// Run code after every navigation (analytics, title update, etc.)
app.router.afterNavigation((route, path) => {
  document.title = `My App — ${route.title || path}`;
  analytics?.trackPageView(path);
});
```

You can register multiple `beforeNavigation` / `afterNavigation` callbacks — they
run in registration order.

### Per-route guards (`beforeEnter`)

For route-specific logic (e.g. role checks on a single admin page) use
`beforeEnter` in the route config object instead of a global guard:

```javascript
await app.initialize({
  routes: {
    '/': HomeComponent,

    '/admin': {
      component: AdminDashboard,
      beforeEnter: async (route, path) => {
        const role = await getCurrentRole();
        if (role !== 'admin') {
          app.navigate('/');
          return false; // cancel
        }
        return true;
      },
    },

    '/users/:id': {
      component: UserDetail,
      loader: async ({ params }) => fetchUser(params.id),
    },
  },
});
```

`beforeEnter` runs **after** global `beforeNavigation` guards and **before** the
route loader. If either returns `false`, navigation is cancelled and the component
never mounts.

### Loading indicator pattern

```javascript
app.router.beforeNavigation(() => {
  document.body.classList.add('loading');
  return true;
});

app.router.afterNavigation(() => {
  document.body.classList.remove('loading');
});
```

## Wildcard Routes

Use wildcard routes to handle URLs that don't match any specific route (like 404 pages):

```javascript
await app.initialize({
    routes: {
        '/': HomeComponent,
        '/about': AboutComponent,
        '/users/:id': UserComponent,
        '*': NotFoundComponent  // This catches everything else
    }
});

class NotFoundComponent extends BaseComponent {
    render() {
        return `
            <div class="not-found">
                <h1>Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/" data-navigate>Go Home</a>
            </div>
        `;
    }
}
```

## Best Practices

### Use Meaningful URLs
Make your URLs descriptive and user-friendly:

```javascript
// Good
'/users/profile'
'/products/electronics/laptops'
'/blog/2025/my-first-post'

// Avoid
'/page1'
'/component2'  
'/xyz123'
```

### Handle Loading States
Show loading indicators while navigating to new pages:

```javascript
router.beforeNavigation(() => {
    // Show loading indicator
    document.body.classList.add('loading');
    return true;
});

router.afterNavigation(() => {
    // Hide loading indicator
    document.body.classList.remove('loading');
});
```

---

*Use meaningful URLs that reflect your app's structure.*
