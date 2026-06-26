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

## Route Guards

Route guards let you run code before navigation happens. This is useful for checking if users are logged in, or redirecting them based on permissions:

```javascript
// Check authentication before showing protected pages
router.beforeNavigation((route, path) => {
    // If trying to access admin pages but not logged in
    if (path.startsWith('/admin') && !user.isLoggedIn) {
        app.navigate('/login');
        return false; // Block the navigation
    }
    
    // If trying to access login page but already logged in
    if (path === '/login' && user.isLoggedIn) {
        app.navigate('/dashboard');
        return false; // Block the navigation
    }
    
    return true; // Allow the navigation
});

// Run code after navigation completes
router.afterNavigation((route, path) => {
    console.log('User navigated to:', path);
    
    // Track page views for analytics
    analytics.trackPageView(path);
    
    // Update page title
    document.title = `My App - ${route.title || 'Page'}`;
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
