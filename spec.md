# LocalServe Restaurant - v17

## Current State
Full-stack restaurant ordering app on ICP/Caffeine with Firebase backend. Has menu display, cart, orders, order tracking (basic), restaurant admin panel, super admin panel. Order tracking page exists at /track-order but lacks countdown timer and full detail display. Restaurant admin receives orders via Firebase real-time listener but has no audio notification. Menu page has TypewriterHeading but no search bar.

## Requested Changes (Diff)

### Add
1. **Menu Search Bar** (RestaurantPage): Below the TypewriterHeading ("Our Menu" animation), add a powerful search input that filters menu items by item name and category name simultaneously. Search is fuzzy/partial - even partial name matches show results. Matching items are shown in a flat search results list (with ADD/qty controls) replacing the normal category-grouped view when search is active. Clearing the input returns to normal category view.
2. **Order Tracking Countdown + Full Details** (TrackOrderPage): When order status is "accepted" and a deliveryTime is set, show a live countdown timer. Store the timestamp when order was accepted + deliveryTime string, parse into a countdown. Show complete order details: time since order was placed ("X mins ago"), all items with qty and price, total, payment method, order type. If rejected, show the rejection reason prominently. If cancelled, show reason. Countdown updates every second.
3. **New Order Audio Alert** (RestaurantAdminPage + AdminPage): When a new order arrives (Firebase onValue fires with more orders than previously), play an alert sound. Use Web Audio API (no external files needed) to synthesize a beeping notification sound. The alert should repeat a few times to grab attention. This applies to both restaurant-specific admin panel (/restaurant-admin) and super admin (/admin).

### Modify
- RestaurantPage: Add `searchQuery` state; when non-empty, show filtered search results instead of category-grouped menu. Search matches item name (fuzzy partial) and category name.
- TrackOrderPage: Add countdown timer hook, "time ago" display, full item breakdown with addons, payment method display, order type display. Add accepted-at timestamp field support.
- RestaurantAdminPage: Add useEffect that watches orders count and plays audio alert when new orders arrive. Track previous order count in a ref.
- AdminPage: Same audio alert logic.
- useFirebase.ts: When updating order status to "accepted", store `acceptedAt: Date.now()` alongside the status update.
- types/index.ts: Add `acceptedAt?: number` to Order interface.

### Remove
Nothing removed.

## Implementation Plan
1. Update `types/index.ts` - add `acceptedAt` field to Order
2. Update `useFirebase.ts` - store acceptedAt when accepting order
3. Update `RestaurantPage.tsx` - add search bar below TypewriterHeading, implement fuzzy search filter
4. Update `TrackOrderPage.tsx` - add countdown timer, full order details, time-ago, rejection reason
5. Update `RestaurantAdminPage.tsx` - add audio alert for new orders using Web Audio API
6. Update `AdminPage.tsx` - same audio alert logic
