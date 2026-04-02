import { onValue, push, ref, remove, set, update } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import type {
  Category,
  MenuItem,
  Offer,
  OfferItem,
  Order,
  Restaurant,
} from "../types";

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = ref(db, "restaurants");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      const list: Restaurant[] = Object.entries(data).map(
        ([id, v]: [string, any]) => ({
          id,
          name: v.name || "",
          description: v.description || "",
          images: v.images ? Object.values(v.images) : [],
          coverImage: v.coverImage || "",
          ownerName: v.ownerName || "",
          phone: v.phone || "",
          whatsapp: v.whatsapp || "",
          address: v.address || "",
          openTime: v.openTime || "09:00",
          closeTime: v.closeTime || "22:00",
          holidays: v.holidays ? Object.values(v.holidays) : [],
          homeDeliveryAvailable: v.homeDeliveryAvailable || false,
          deliveryCharge: v.deliveryCharge || 0,
          packingCharge: v.packingCharge || 0,
          platformFee: v.platformFee || 0,
          minDeliveryOrder: v.minDeliveryOrder || 0,
          emergencyNo: v.emergencyNo || "",
          cyberCrimeNo: v.cyberCrimeNo || "",
          announcement: v.announcement || "",
          isActive: v.isActive !== false,
          upiId: v.upiId || "",
          adminPassword: v.adminPassword || "",
        }),
      );
      setRestaurants(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { restaurants, loading };
}

export function useRestaurant(id: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const r = ref(db, `restaurants/${id}`);
    const unsub = onValue(r, (snap) => {
      const v = snap.val();
      if (v) {
        setRestaurant({
          id,
          name: v.name || "",
          description: v.description || "",
          images: v.images ? Object.values(v.images) : [],
          coverImage: v.coverImage || "",
          ownerName: v.ownerName || "",
          phone: v.phone || "",
          whatsapp: v.whatsapp || "",
          address: v.address || "",
          openTime: v.openTime || "09:00",
          closeTime: v.closeTime || "22:00",
          holidays: v.holidays ? Object.values(v.holidays) : [],
          homeDeliveryAvailable: v.homeDeliveryAvailable || false,
          deliveryCharge: v.deliveryCharge || 0,
          packingCharge: v.packingCharge || 0,
          platformFee: v.platformFee || 0,
          minDeliveryOrder: v.minDeliveryOrder || 0,
          emergencyNo: v.emergencyNo || "",
          cyberCrimeNo: v.cyberCrimeNo || "",
          announcement: v.announcement || "",
          isActive: v.isActive !== false,
          upiId: v.upiId || "",
          adminPassword: v.adminPassword || "",
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  return { restaurant, loading };
}

export function useCategories(restaurantId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    const r = ref(db, `categories/${restaurantId}`);
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      const list: Category[] = Object.entries(data)
        .map(([id, v]: [string, any]) => ({
          id,
          name: v.name || "",
          type: v.type || "veg",
          order: v.order || 0,
          image: v.image || "",
        }))
        .sort((a, b) => a.order - b.order);
      setCategories(list);
      setLoading(false);
    });
    return () => unsub();
  }, [restaurantId]);

  return { categories, loading };
}

export function useMenuItems(restaurantId: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    const r = ref(db, `items/${restaurantId}`);
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      const list: MenuItem[] = Object.entries(data).map(
        ([id, v]: [string, any]) => ({
          id,
          name: v.name || "",
          categoryId: v.categoryId || "",
          image: v.image || "",
          price: v.price || 0,
          hasHalfFull: v.hasHalfFull || false,
          halfPrice: v.halfPrice || 0,
          mediumPrice: v.mediumPrice || 0,
          fullPrice: v.fullPrice || 0,
          isFree: v.isFree || false,
          isOutOfStock: v.isOutOfStock || false,
          type: v.type || "veg",
          dayOffer: v.dayOffer || undefined,
          bundleOffer: v.bundleOffer || undefined,
          description: v.description || undefined,
          addons: v.addons ? Object.values(v.addons) : undefined,
        }),
      );
      setItems(list);
      setLoading(false);
    });
    return () => unsub();
  }, [restaurantId]);

  return { items, loading };
}

export function useOffers(restaurantId: string) {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (!restaurantId) return;
    const r = ref(db, `offers/${restaurantId}`);
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      const list: Offer[] = Object.entries(data).map(
        ([id, v]: [string, any]) => ({
          id,
          name: v.name || "",
          price: v.price || 0,
          items: v.items ? Object.values(v.items) : [],
          validDay: v.validDay || "everyday",
        }),
      );
      setOffers(list);
    });
    return () => unsub();
  }, [restaurantId]);

  return { offers };
}

export function useOrders(restaurantId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = restaurantId ? `orders/${restaurantId}` : "orders";
    const r = ref(db, path);
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      let list: Order[] = [];
      if (restaurantId) {
        list = Object.entries(data).map(([id, v]: [string, any]) => ({
          id,
          ...v,
          items: v.items ? Object.values(v.items) : [],
        }));
      } else {
        for (const [rId, rOrders] of Object.entries(data)) {
          for (const [id, v] of Object.entries((rOrders as any) || {})) {
            const vt = v as any;
            list.push({
              id,
              restaurantId: rId,
              ...vt,
              items: vt.items ? Object.values(vt.items) : [],
            });
          }
        }
      }
      list.sort((a, b) => b.timestamp - a.timestamp);
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, [restaurantId]);

  return { orders, loading };
}

// CRUD helpers
export async function saveRestaurant(
  data: Partial<Restaurant> & { id?: string },
) {
  const { id, images, holidays, ...rest } = data as any;
  const payload: any = { ...rest };
  if (images)
    payload.images = Object.fromEntries(
      images.map((img: string, i: number) => [i, img]),
    );
  if (holidays)
    payload.holidays = Object.fromEntries(
      holidays.map((h: string, i: number) => [i, h]),
    );
  if (id) {
    await update(ref(db, `restaurants/${id}`), payload);
    return id;
  }
  const newRef = push(ref(db, "restaurants"));
  await set(newRef, payload);
  return newRef.key;
}

export async function deleteRestaurant(id: string) {
  await remove(ref(db, `restaurants/${id}`));
}

export async function saveCategory(
  restaurantId: string,
  data: Partial<Category> & { id?: string },
) {
  const { id, ...rest } = data;
  if (id) {
    await update(ref(db, `categories/${restaurantId}/${id}`), rest);
  } else {
    const newRef = push(ref(db, `categories/${restaurantId}`));
    await set(newRef, rest);
  }
}

export async function deleteCategory(restaurantId: string, categoryId: string) {
  await remove(ref(db, `categories/${restaurantId}/${categoryId}`));
}

export async function saveMenuItem(
  restaurantId: string,
  data: Partial<MenuItem> & { id?: string },
) {
  const { id, addons, ...rest } = data as any;
  // Remove undefined values - Firebase rejects them
  const clean: any = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  );
  if (addons && addons.length > 0) {
    clean.addons = Object.fromEntries(
      addons.map((a: any, i: number) => [i, a]),
    );
  }
  if (id) {
    await set(ref(db, `items/${restaurantId}/${id}`), clean);
  } else {
    const newRef = push(ref(db, `items/${restaurantId}`));
    await set(newRef, clean);
  }
}

export async function deleteMenuItem(restaurantId: string, itemId: string) {
  await remove(ref(db, `items/${restaurantId}/${itemId}`));
}

export async function saveOffer(
  restaurantId: string,
  data: Partial<Offer> & { id?: string },
) {
  const { id, items, ...rest } = data as any;
  const payload: any = { ...rest };
  if (items)
    payload.items = Object.fromEntries(
      items.map((it: OfferItem, i: number) => [i, it]),
    );
  if (id) {
    await update(ref(db, `offers/${restaurantId}/${id}`), payload);
  } else {
    const newRef = push(ref(db, `offers/${restaurantId}`));
    await set(newRef, payload);
  }
}

export async function deleteOffer(restaurantId: string, offerId: string) {
  await remove(ref(db, `offers/${restaurantId}/${offerId}`));
}

export async function saveOrder(
  restaurantId: string,
  order: Omit<Order, "id">,
) {
  const { items, ...rest } = order as any;
  const payload: any = { ...rest };
  if (items)
    payload.items = Object.fromEntries(
      items.map((it: any, i: number) => [i, it]),
    );
  const newRef = push(ref(db, `orders/${restaurantId}`));
  await set(newRef, payload);
  return newRef.key;
}

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: string,
  rejectionReason?: string,
  deliveryTime?: string,
) {
  const updates: any = { status };
  if (rejectionReason) updates.rejectionReason = rejectionReason;
  if (deliveryTime) updates.deliveryTime = deliveryTime;
  await update(ref(db, `orders/${restaurantId}/${orderId}`), updates);
}

export async function saveAnnouncement(restaurantId: string, text: string) {
  await update(ref(db, `restaurants/${restaurantId}`), { announcement: text });
}
