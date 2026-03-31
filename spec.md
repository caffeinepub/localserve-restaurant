# LocalServe Restaurant

## Current State
App has a super admin panel at `/admin` (password: `Paramjeet1$1`) where the main admin can manage all restaurants, menus, categories, offers, orders, and announcements. Each restaurant is stored in Firebase with various fields including `upiId`.

There is currently NO per-restaurant admin panel. All management is done only by the super admin.

## Requested Changes (Diff)

### Add
- `adminPassword` field to `Restaurant` type (optional string)
- New page `RestaurantAdminPage.tsx` at route `/restaurant-admin`
  - Shows a login screen: dropdown of all restaurant names to select, then a password field
  - On correct password for that restaurant, shows a scoped admin panel for ONLY that restaurant
  - Sections available: Menu Categories, Menu Items, Offers, Orders, Announcements, Restaurant Info (edit basic details like timings, UPI, announcement -- but NOT password, images are view-only)
  - No ability to delete the restaurant or manage other restaurants
  - Logout button
- New route `/restaurant-admin` in App.tsx

### Modify
- `useFirebase.ts`: Map `adminPassword` field in `useRestaurants` and `useRestaurant` hooks; include in `saveRestaurant`
- `AdminPage.tsx` `RestaurantForm`: Add an `adminPassword` field (text input, labeled "Restaurant Admin Password") so super admin can set per-restaurant passwords
- `types/index.ts`: Add `adminPassword?: string` to Restaurant interface

### Remove
- Nothing removed

## Implementation Plan
1. Update `types/index.ts` - add `adminPassword?: string` to Restaurant
2. Update `useFirebase.ts` - include `adminPassword` in both restaurant mapping functions and `saveRestaurant`
3. Update `AdminPage.tsx` RestaurantForm - add password input field (plain text, or password type with show/hide toggle)
4. Create `RestaurantAdminPage.tsx` - restaurant owner login + scoped management panel
5. Update `App.tsx` - add route `/restaurant-admin`
