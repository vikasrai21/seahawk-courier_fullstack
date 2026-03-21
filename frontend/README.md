# Seahawk Frontend — Changed Files Only

Drop these files into your existing frontend repo, replacing the originals.

## Files in this package
Only files that were **changed or newly created** are included.
All other frontend files in your repo remain untouched.

## Steps after dropping in

### 1. Install new dependency
```bash
npm install react-helmet-async
```

### 2. Optional — activate SSR pre-rendering
```bash
npm install -D vite-plugin-ssg
# Then in Railway, change build command from:
#   vite build
# to:
#   vite-ssg build
```

### 3. For PWA icons
Add these two image files to your `/public/images/` folder:
- `icon-192.png` (192×192px — Sea Hawk logo)
- `icon-512.png` (512×512px — Sea Hawk logo)

## What changed

| File | What changed |
|------|-------------|
| `index.html` | **NEW** — PWA meta tags, theme-color, apple-touch-icon |
| `vite.config.js` | Manual chunk splitting, SSG pre-render config |
| `package.json` | Updated deps including react-helmet-async |
| `src/App.jsx` | React.lazy() on all 25 app pages, ErrorBoundary, client portal routes |
| `src/main.jsx` | HelmetProvider + service worker registration |
| `src/services/api.js` | CSRF token auto-attached to every request |
| `src/components/layout/AppLayout.jsx` | PWA install banner, keyboard shortcuts, ShortcutsHelp |
| `src/components/seo/PageMeta.jsx` | **NEW** — per-page meta/OG tags |
| `src/components/seo/LocalBusinessSchema.jsx` | **NEW** — JSON-LD Google structured data |
| `src/components/ui/EmptyState.jsx` | **NEW** — reusable empty state component |
| `src/components/ui/ErrorBoundary.jsx` | **NEW** — catches render crashes |
| `src/components/ui/ShortcutsHelp.jsx` | **NEW** — keyboard shortcuts modal |
| `src/hooks/useDebounce.js` | **NEW** — 300ms debounce hook |
| `src/hooks/useKeyboardShortcuts.js` | **NEW** — N/I/T/D/S/? shortcuts |
| `src/hooks/usePWA.js` | **NEW** — PWA install prompt hook |
| `src/pages/public/LandingPage.jsx` | PageMeta + LocalBusinessSchema + no more alert() |
| `src/pages/public/BookPage.jsx` | Best Rate auto-carrier selector |
| `src/pages/public/ContactPage.jsx` | alert() → inline error state |
| `src/pages/client/*.jsx` | **NEW** — 5 client self-service portal pages |
| `src/pages/ShipmentDashboardPage.jsx` | useDebounce on search + EmptyState |
| `src/pages/NDRPage.jsx` | useDebounce + EmptyState |
| `src/pages/QuoteHistoryPage.jsx` | useDebounce + EmptyState |
| `src/pages/WalletPage.jsx` | useDebounce + EmptyState |
| `src/pages/ClientsPage.jsx` | useDebounce |
| `src/pages/ReconciliationPage.jsx` | EmptyState |
| `src/pages/PickupSchedulerPage.jsx` | EmptyState |
| `src/pages/UsersPage.jsx` | EmptyState |
| `src/pages/RateCalculatorPage.jsx` | alert() → inline errors, sessionStorage |
| `src/pages/ContactPage.jsx` | alert() → inline error state |
| `public/manifest.json` | **NEW** — PWA manifest |
| `public/sw.js` | **NEW** — service worker |
| `public/robots.txt` | **NEW** — blocks /app/, /api/ from crawlers |
| `public/sitemap.xml` | **NEW** — all public pages listed |
| `public/embed/tracker.js` | **NEW** — embeddable tracking widget |
| `public/embed/demo.html` | **NEW** — embed demo + copy-paste code |
