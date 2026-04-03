# LocalServe Restaurant

## Current State
- HomePage has a "Track Order" button in the navbar (both mobile & desktop)
- RestaurantPage has a "Track Order" button but it's hidden in the bottom info section alongside Call/WhatsApp/Emergency buttons — not prominently visible
- TrackOrderPage only supports tracking by Order Number (requires selecting restaurant + entering order number)
- Order data in Firebase stores the customer `phone` field

## Requested Changes (Diff)

### Add
- **RestaurantPage**: A prominent "Track Order" button at the TOP of the page (in the sticky header nav bar, right side, visible immediately when page loads)
- **TrackOrderPage**: A second search option — "Track by Mobile Number" — where customer enters their 10-digit mobile number used at order time, and all orders matching that phone number (across or within the selected restaurant) are shown as a list to choose from

### Modify
- **TrackOrderPage**: Add a tab/toggle UI to switch between "Track by Order ID" and "Track by Mobile Number" search modes
- **TrackOrderPage**: When tracking by mobile number, query Firebase orders for the selected restaurant and filter by phone field match, then show list of matching orders

### Remove
- Nothing removed

## Implementation Plan
1. **RestaurantPage**: Add a `<button>` with "Track Order" label + Search/MapPin icon in the sticky top header nav (right side, before or after the OPEN/CLOSED badge) — navigates to `/track`
2. **TrackOrderPage**: Add a toggle between two modes: "By Order ID" (existing flow) and "By Mobile Number" (new flow)
3. **TrackOrderPage (mobile mode)**: When user selects mobile mode, show a restaurant dropdown + mobile number input. On submit, query `orders/{restaurantId}` and filter all orders where `phone === mobileInput`. Show list of matched orders (order number, status, timestamp). Customer clicks one to see full details.
4. The full order detail view is reused for both modes.
