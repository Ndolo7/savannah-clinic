# Savannah Clinic

## Design and architecture

The screen is divided into four components:
- `Login` owns the sign-in form.
- `ClinicConsole` owns the authenticated shell, URL-driven toolbar, request lifecycle, and pagination table rows are rendered inside the inventory section and link to the shareable item route.
- `app/items/[id]/page.tsx` owns item detail loading and stock correction. 
- `lib/dummyjson.ts` is the data boundary, keeping API URLs, request errors, and response types out of UI components.

### State ownership

- **Server data:** products, categories, totals, and item details live in React state at the component that renders them. They are fetched from DummyJSON and replaced only by the latest request.
- **URL state:** query, category, sort, order, and page live in `useSearchParams`. This makes refreshes and copied URLs reproduce the same view and keeps browser navigation meaningful.
- **Local UI state:** session hydration, login fields, loading/error flags, the detail form, and save feedback stay local because they are transient interaction state.

### Fetching, caching, and invalidation

The client to use `fetch` with `cache: 'no-store'`, so inventory and detail screens never present stale server data as authoritative. Search is delayed by 350ms, every request receives an `AbortController`, and a monotonically increasing request id ignores late responses. Filter and sort changes reset the page to zero, if a server total makes the current page invalid, the URL is corrected to the last valid page. A retry simply re-runs the current URL state. A successful stock update updates the detail view from the mutation response, and a refresh is available for recovery.

### Visual system

Use a small tokenized palette in `app/globals.css`: ink, muted slate, paper, line, and a teal brand accent. Use Geist Sans typography for body and Geist Mono for compact metadata. 
Use Tailwind utility classes plus component CSS for spacing the dense inventory table, with flexbox for primary layout and a responsive table-to-card treatment at narrow widths. No component-library defaults are relied on for the product surface.

### Accessibility

Implement landmarks, labelled inputs/selects, visible keyboard focus, a real table on desktop, `aria-live` status messaging, `role="alert"` error states, descriptive link and button labels, and a skip link. Loading and empty states to be explicit rather than silent. Test the layout at 360px to ensure it does not require pointer-only controls.

## Decision log

1. **URL state instead of component-only filters.** A local reducer would be simpler, but it would lose the required refresh and copied-link behavior. Search, category, sort, order, and page therefore use `useSearchParams`, with page resets performed in the same URL update.
2. **Abort plus request identity for search races.** Debounce alone reduces traffic but cannot prevent an older slow response from winning. Each request is both abortable and tagged with a request id, so the UI remains correct even when the mock service ignores cancellation.
3. **`cache: 'no-store'` instead of a client cache.** A cache would make the inventory feel fast but could show stale counts after a correction. The brief values correct stock over cache hits, so retryable no-store requests are the deliberate trade-off.
4. **Inline stock correction instead of optimistic mutation.** An optimistic update would look responsive but would be misleading if DummyJSON rejects or simulates a failure. The form stays in a saving state until the API returns and preserves the last confirmed value on error.

