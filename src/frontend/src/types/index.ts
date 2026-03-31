export interface Restaurant {
  id: string;
  name: string;
  description: string;
  images: string[];
  coverImage: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  openTime: string;
  closeTime: string;
  holidays: string[];
  homeDeliveryAvailable: boolean;
  deliveryCharge: number;
  packingCharge: number;
  platformFee: number;
  emergencyNo: string;
  cyberCrimeNo: string;
  announcement: string;
  isActive: boolean;
  upiId?: string;
  adminPassword?: string;
}

export interface Category {
  id: string;
  name: string;
  type: "veg" | "nonveg";
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  image: string;
  price: number;
  hasHalfFull: boolean;
  halfPrice: number;
  mediumPrice: number;
  fullPrice: number;
  isFree: boolean;
  isOutOfStock: boolean;
  type: "veg" | "nonveg";
  dayOffer?: { day: string; price: number };
  bundleOffer?: string;
  description?: string;
}

export interface Offer {
  id: string;
  name: string;
  price: number;
  items: { itemId: string; qty: number }[];
  validDay: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  address: string;
  phone: string;
  orderType: "delivery" | "dinein";
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  packingCharge: number;
  platformFee: number;
  total: number;
  paymentMethod: "online" | "cod";
  utrNo: string;
  status: "pending" | "accepted" | "rejected" | "delivered";
  rejectionReason: string;
  timestamp: number;
  restaurantName: string;
  restaurantId: string;
}

export interface CartItem {
  itemId: string;
  name: string;
  qty: number;
  price: number;
  variant: string;
}
