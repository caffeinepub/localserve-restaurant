import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  List,
  LogOut,
  Megaphone,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteCategory,
  deleteMenuItem,
  deleteOffer,
  saveAnnouncement,
  saveCategory,
  saveMenuItem,
  saveOffer,
  saveRestaurant,
  updateOrderStatus,
  useCategories,
  useMenuItems,
  useOffers,
  useOrders,
  useRestaurants,
} from "../hooks/useFirebase";
import type { Category, MenuItem, Offer, Order, Restaurant } from "../types";

const DAYS_LIST = [
  "everyday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ---- Login Screen ----

function playNewOrderAlert() {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const beep = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.6, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + duration,
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };
    beep(880, 0, 0.15);
    beep(1100, 0.2, 0.15);
    beep(1320, 0.4, 0.25);
    beep(880, 0.8, 0.15);
    beep(1100, 1.0, 0.15);
    beep(1320, 1.2, 0.25);
  } catch (_e) {
    // Audio not available, silently fail
  }
}

function RestaurantLoginGate({
  restaurants,
  onLogin,
}: {
  restaurants: Restaurant[];
  onLogin: (restaurant: Restaurant) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");

  function submit() {
    const restaurant = restaurants.find((r) => r.id === selectedId);
    if (!restaurant) {
      setErr("Please select a restaurant");
      return;
    }
    if (!restaurant.adminPassword) {
      setErr(
        "No password set for this restaurant. Please contact the main administrator.",
      );
      return;
    }
    if (pw === restaurant.adminPassword) {
      onLogin(restaurant);
    } else {
      setErr("Incorrect password");
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1418] flex items-center justify-center px-4">
      <div className="bg-[#1B2228] rounded-2xl border border-[#2A333A] p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UtensilsCrossed size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Restaurant Admin</h1>
          <p className="text-[#A9B3BC] text-sm mt-1">Manage your restaurant</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-[#A9B3BC]">Select Restaurant</Label>
            <Select
              value={selectedId}
              onValueChange={(v) => {
                setSelectedId(v);
                setErr("");
              }}
            >
              <SelectTrigger
                data-ocid="restaurant_admin.select"
                className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
              >
                <SelectValue placeholder="Choose your restaurant..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1B2228] border-[#2A333A]">
                {restaurants.map((r) => (
                  <SelectItem
                    key={r.id}
                    value={r.id}
                    className="text-white hover:bg-[#2A333A]"
                  >
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#A9B3BC]">Password</Label>
            <div className="relative mt-1">
              <Input
                data-ocid="restaurant_admin.password.input"
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setErr("");
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Enter your password"
                className="bg-[#0F1418] border-[#2A333A] text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A9B3BC] hover:text-white"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {err && (
            <p
              data-ocid="restaurant_admin.password.error_state"
              className="text-red-400 text-sm"
            >
              {err}
            </p>
          )}
          <Button
            data-ocid="restaurant_admin.login.button"
            onClick={submit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
          >
            Login
          </Button>
          <p className="text-center text-xs text-[#6B7680] mt-2">
            Get your login credentials from the main administrator
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Category Form ----
function CategoryForm({
  initial,
  onSave,
  onCancel,
}: { initial?: Category; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    type: initial?.type || "veg",
    order: initial?.order || 0,
    id: initial?.id,
  });
  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label>Type</Label>
        <Select
          value={form.type}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, type: v as "veg" | "nonveg" }))
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="veg">Veg</SelectItem>
            <SelectItem value="nonveg">Non-Veg</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Order (sort)</Label>
        <Input
          type="number"
          value={form.order}
          onChange={(e) =>
            setForm((f) => ({ ...f, order: Number(e.target.value) }))
          }
          className="mt-1"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => onSave(form)}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

// ---- Menu Item Form ----
function MenuItemForm({
  initial,
  categories,
  onSave,
  onCancel,
}: {
  initial?: MenuItem;
  categories: Category[];
  onSave: (d: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<MenuItem> & { id?: string }>(
    initial || {
      name: "",
      description: "",
      categoryId: "",
      price: 0,
      type: "veg",
      hasHalfFull: false,
      halfPrice: 0,
      mediumPrice: 0,
      fullPrice: 0,
      isFree: false,
      isOutOfStock: false,
      image: "",
    },
  );
  const [dayOfferDay, setDayOfferDay] = useState(initial?.dayOffer?.day || "");
  const [dayOfferPrice, setDayOfferPrice] = useState(
    initial?.dayOffer?.price || 0,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: "" }));
    const b64 = await fileToBase64(file);
    setForm((f) => ({ ...f, image: b64 }));
  }

  function handleSave() {
    const data: any = { ...form };
    if (dayOfferDay) data.dayOffer = { day: dayOfferDay, price: dayOfferPrice };
    onSave(data);
  }

  return (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Name *</Label>
          <Input
            value={form.name || ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label>Description</Label>
          <textarea
            value={form.description || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={2}
            placeholder="Item description (optional)"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={form.categoryId || ""}
            onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={form.type || "veg"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, type: v as "veg" | "nonveg" }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="veg">Veg</SelectItem>
              <SelectItem value="nonveg">Non-Veg</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Price (₹)</Label>
          <Input
            type="number"
            value={form.price || 0}
            onChange={(e) =>
              setForm((f) => ({ ...f, price: Number(e.target.value) }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label>Bundle Offer</Label>
          <Input
            value={form.bundleOffer || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, bundleOffer: e.target.value }))
            }
            placeholder="e.g. 4+1 FREE"
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch
            checked={form.hasHalfFull || false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, hasHalfFull: v }))}
            id="hhf2"
          />
          <Label htmlFor="hhf2">R/M/F Variants</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.isFree || false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isFree: v }))}
            id="ifr2"
          />
          <Label htmlFor="ifr2">Free</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.isOutOfStock || false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isOutOfStock: v }))}
            id="ios2"
          />
          <Label htmlFor="ios2">Out of Stock</Label>
        </div>
      </div>
      {form.hasHalfFull && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Regular (₹)</Label>
            <Input
              type="number"
              value={form.halfPrice || 0}
              onChange={(e) =>
                setForm((f) => ({ ...f, halfPrice: Number(e.target.value) }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>Medium (₹)</Label>
            <Input
              type="number"
              value={form.mediumPrice || 0}
              onChange={(e) =>
                setForm((f) => ({ ...f, mediumPrice: Number(e.target.value) }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>Full (₹)</Label>
            <Input
              type="number"
              value={form.fullPrice || 0}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullPrice: Number(e.target.value) }))
              }
              className="mt-1"
            />
          </div>
        </div>
      )}
      <div className="border rounded-xl p-3">
        <Label className="font-semibold">Day Offer (optional)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Select value={dayOfferDay} onValueChange={setDayOfferDay}>
            <SelectTrigger>
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_LIST.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={dayOfferPrice}
            onChange={(e) => setDayOfferPrice(Number(e.target.value))}
            placeholder="Offer price"
          />
        </div>
      </div>
      <div>
        <Label>Image</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImage}
        />
        <div className="mt-1 flex items-center gap-3">
          {form.image && (
            <img
              src={form.image}
              alt="item"
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            Upload
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

// ---- Offer Form ----
function OfferForm({
  initial,
  menuItems,
  onSave,
  onCancel,
}: {
  initial?: Offer;
  menuItems: MenuItem[];
  onSave: (d: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    price: initial?.price || 0,
    validDay: initial?.validDay || "everyday",
    items: initial?.items || ([] as { itemId: string; qty: number }[]),
    id: initial?.id,
  });
  const [selItemId, setSelItemId] = useState("");
  const [selQty, setSelQty] = useState(1);

  function addOfferItem() {
    if (!selItemId) return;
    setForm((f) => ({
      ...f,
      items: [
        ...f.items.filter((i) => i.itemId !== selItemId),
        { itemId: selItemId, qty: selQty },
      ],
    }));
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Offer Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Price (₹)</Label>
          <Input
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm((f) => ({ ...f, price: Number(e.target.value) }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label>Valid Day</Label>
          <Select
            value={form.validDay}
            onValueChange={(v) => setForm((f) => ({ ...f, validDay: v }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_LIST.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="border rounded-xl p-3">
        <Label className="font-semibold">Items in Offer</Label>
        <div className="flex gap-2 mt-2">
          <Select value={selItemId} onValueChange={setSelItemId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {menuItems.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={selQty}
            onChange={(e) => setSelQty(Number(e.target.value))}
            className="w-16"
            min={1}
          />
          <Button variant="outline" onClick={addOfferItem}>
            <Plus size={14} />
          </Button>
        </div>
        <div className="mt-2 space-y-1">
          {form.items.map((oi, i) => (
            <div
              key={String(i)}
              className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5"
            >
              <span>
                {menuItems.find((m) => m.id === oi.itemId)?.name || oi.itemId} ×
                {oi.qty}
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    items: f.items.filter((_, j) => j !== i),
                  }))
                }
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => onSave(form)}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

// ---- Main Restaurant Admin Panel ----
export function RestaurantAdminPage() {
  const { restaurants, loading: restsLoading } = useRestaurants();
  const [authedRestaurant, setAuthedRestaurant] = useState<Restaurant | null>(
    null,
  );
  const [activeSection, setActiveSection] = useState("orders");

  const restaurantId = authedRestaurant?.id || "";
  const { categories } = useCategories(restaurantId);
  const { items } = useMenuItems(restaurantId);
  const { offers } = useOffers(restaurantId);
  const { orders } = useOrders(restaurantId || undefined);

  const prevOrderCountRef = useRef<number>(-1);
  useEffect(() => {
    if (!authedRestaurant) {
      prevOrderCountRef.current = -1;
      return;
    }
    if (prevOrderCountRef.current === -1) {
      prevOrderCountRef.current = orders.length;
      return;
    }
    if (orders.length > prevOrderCountRef.current) {
      playNewOrderAlert();
      toast.success("🔔 New order received!", { duration: 5000 });
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length, authedRestaurant]);

  // Dialog states
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | undefined>();
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();
  const [offerDialog, setOfferDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [expandedOrder, setExpandedOrder] = useState("");

  // Restaurant info edit state
  const [infoForm, setInfoForm] = useState<Partial<Restaurant>>({
    phone: "",
    whatsapp: "",
    address: "",
    openTime: "09:00",
    closeTime: "22:00",
    homeDeliveryAvailable: false,
    deliveryCharge: 0,
    packingCharge: 0,
    platformFee: 0,
    upiId: "",
    isActive: true,
    emergencyNo: "",
    cyberCrimeNo: "",
  });
  const [infoSaving, setInfoSaving] = useState(false);

  if (restsLoading) {
    return (
      <div className="min-h-screen bg-[#0F1418] flex items-center justify-center">
        <div
          data-ocid="restaurant_admin.loading_state"
          className="text-[#A9B3BC]"
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!authedRestaurant) {
    return (
      <RestaurantLoginGate
        restaurants={restaurants}
        onLogin={(r) => {
          setAuthedRestaurant(r);
          setAnnouncementText(r.announcement || "");
          setInfoForm({
            phone: r.phone,
            whatsapp: r.whatsapp,
            address: r.address,
            openTime: r.openTime,
            closeTime: r.closeTime,
            homeDeliveryAvailable: r.homeDeliveryAvailable,
            deliveryCharge: r.deliveryCharge,
            packingCharge: r.packingCharge,
            platformFee: r.platformFee,
            upiId: r.upiId || "",
            isActive: r.isActive,
            emergencyNo: r.emergencyNo,
            cyberCrimeNo: r.cyberCrimeNo,
          });
        }}
      />
    );
  }

  const navItems = [
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "categories", label: "Categories", icon: List },
    { id: "items", label: "Menu Items", icon: Package },
    { id: "offers", label: "Offers", icon: Tag },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "info", label: "Restaurant Info", icon: Store },
  ];

  async function handleSaveCategory(data: any) {
    try {
      await saveCategory(restaurantId, data);
      toast.success("Category saved!");
      setCatDialog(false);
      setEditingCat(undefined);
    } catch {
      toast.error("Failed to save category");
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    await deleteCategory(restaurantId, id);
    toast.success("Deleted");
  }

  async function handleSaveItem(data: any) {
    try {
      await saveMenuItem(restaurantId, data);
      toast.success("Item saved!");
      setItemDialog(false);
      setEditingItem(undefined);
    } catch {
      toast.error("Failed to save item");
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await deleteMenuItem(restaurantId, id);
    toast.success("Deleted");
  }

  async function handleSaveOffer(data: any) {
    try {
      await saveOffer(restaurantId, data);
      toast.success("Offer saved!");
      setOfferDialog(false);
      setEditingOffer(undefined);
    } catch {
      toast.error("Failed to save offer");
    }
  }

  async function handleDeleteOffer(id: string) {
    if (!confirm("Delete this offer?")) return;
    await deleteOffer(restaurantId, id);
    toast.success("Deleted");
  }

  async function handleAccept(order: Order) {
    await updateOrderStatus(restaurantId, order.id, "accepted");
    toast.success("Order accepted");
  }

  async function handleReject(order: Order) {
    setRejectOrderId(order.id);
    setRejectDialog(true);
  }

  async function confirmReject() {
    await updateOrderStatus(
      restaurantId,
      rejectOrderId,
      "rejected",
      rejectReason,
    );
    setRejectDialog(false);
    setRejectReason("");
    toast.success("Order rejected");
  }

  async function handleSaveAnnouncement() {
    await saveAnnouncement(restaurantId, announcementText);
    toast.success("Announcement updated!");
  }

  async function handleSaveInfo() {
    setInfoSaving(true);
    try {
      await saveRestaurant({ id: restaurantId, ...infoForm });
      toast.success("Restaurant info updated!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setInfoSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1418] flex flex-col">
      {/* Header */}
      <header className="bg-[#1B2228] border-b border-[#2A333A] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              {authedRestaurant.name}
            </h1>
            <p className="text-[#A9B3BC] text-xs">Restaurant Admin Panel</p>
          </div>
        </div>
        <Button
          data-ocid="restaurant_admin.logout.button"
          variant="outline"
          size="sm"
          onClick={() => setAuthedRestaurant(null)}
          className="border-[#2A333A] text-[#A9B3BC] hover:text-white hover:bg-[#2A333A]"
        >
          <LogOut size={14} className="mr-1" />
          Logout
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 bg-[#1B2228] border-r border-[#2A333A] flex flex-col py-4 hidden md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              data-ocid={`restaurant_admin.${item.id}.tab`}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? "bg-orange-500/10 text-orange-400 border-r-2 border-orange-500"
                  : "text-[#A9B3BC] hover:text-white hover:bg-[#2A333A]"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden w-full absolute top-[57px] left-0 z-10 bg-[#1B2228] border-b border-[#2A333A] flex overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                activeSection === item.id
                  ? "text-orange-400 border-b-2 border-orange-500"
                  : "text-[#A9B3BC]"
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-12 md:pt-4">
          {/* Orders */}
          {activeSection === "orders" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Orders</h2>
              {orders.length === 0 ? (
                <div
                  data-ocid="restaurant_admin.orders.empty_state"
                  className="text-center py-12 text-[#A9B3BC]"
                >
                  No orders yet
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order, idx) => (
                    <div
                      key={order.id}
                      data-ocid={`restaurant_admin.orders.item.${idx + 1}`}
                      className="bg-[#1B2228] border border-[#2A333A] rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold">
                              #{order.orderNo}
                            </span>
                            <Badge
                              className={`text-xs ${
                                STATUS_COLORS[order.status] || ""
                              }`}
                            >
                              {order.status}
                            </Badge>
                            <span className="text-[#A9B3BC] text-xs">
                              {new Date(order.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[#A9B3BC] text-sm mt-1">
                            {order.customerName} • {order.phone} •{" "}
                            {order.orderType === "delivery"
                              ? "🏠 Delivery"
                              : "🍽️ Dine-in"}
                          </p>
                          <p className="text-white font-semibold mt-0.5">
                            ₹{order.total}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAccept(order)}
                              >
                                <Check size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(order)}
                              >
                                <X size={14} />
                              </Button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrder(
                                expandedOrder === order.id ? "" : order.id,
                              )
                            }
                            className="text-[#A9B3BC] hover:text-white p-1"
                          >
                            {expandedOrder === order.id ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                      {expandedOrder === order.id && (
                        <div className="mt-3 border-t border-[#2A333A] pt-3 space-y-1">
                          {order.items.map((item, i) => (
                            <div
                              key={String(i)}
                              className="flex justify-between text-sm text-[#A9B3BC]"
                            >
                              <span>
                                {item.name}
                                {item.variant ? ` (${item.variant})` : ""} ×
                                {item.qty}
                              </span>
                              <span>₹{item.price * item.qty}</span>
                            </div>
                          ))}
                          {order.address && (
                            <p className="text-xs text-[#6B7680] mt-2">
                              📍 {order.address}
                            </p>
                          )}
                          <p className="text-xs text-[#6B7680]">
                            Payment:{" "}
                            {order.paymentMethod === "online"
                              ? "Online"
                              : "COD"}
                            {order.utrNo ? ` (UTR: ${order.utrNo})` : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories */}
          {activeSection === "categories" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Categories</h2>
                <Button
                  data-ocid="restaurant_admin.categories.button"
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => {
                    setEditingCat(undefined);
                    setCatDialog(true);
                  }}
                >
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
              {categories.length === 0 ? (
                <div
                  data-ocid="restaurant_admin.categories.empty_state"
                  className="text-center py-12 text-[#A9B3BC]"
                >
                  No categories yet
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      data-ocid={`restaurant_admin.categories.item.${idx + 1}`}
                      className="bg-[#1B2228] border border-[#2A333A] rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cat.type === "veg" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-white font-medium">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#A9B3BC] hover:text-white"
                          onClick={() => {
                            setEditingCat(cat);
                            setCatDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteCategory(cat.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Menu Items */}
          {activeSection === "items" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Menu Items</h2>
                <Button
                  data-ocid="restaurant_admin.items.button"
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => {
                    setEditingItem(undefined);
                    setItemDialog(true);
                  }}
                >
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
              {items.length === 0 ? (
                <div
                  data-ocid="restaurant_admin.items.empty_state"
                  className="text-center py-12 text-[#A9B3BC]"
                >
                  No items yet
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      data-ocid={`restaurant_admin.items.item.${idx + 1}`}
                      className="bg-[#1B2228] border border-[#2A333A] rounded-xl p-3"
                    >
                      <div className="flex gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                item.type === "veg"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <span className="text-white font-medium text-sm truncate">
                              {item.name}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[#A9B3BC] text-xs mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-orange-400 text-sm font-semibold mt-1">
                            ₹
                            {item.hasHalfFull
                              ? `${item.halfPrice} / ${item.fullPrice}`
                              : item.price}
                          </p>
                          {item.isOutOfStock && (
                            <Badge className="bg-red-100 text-red-700 text-xs mt-1">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-[#A9B3BC] hover:text-white text-xs"
                          onClick={() => {
                            setEditingItem(item);
                            setItemDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Offers */}
          {activeSection === "offers" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Special Offers</h2>
                <Button
                  data-ocid="restaurant_admin.offers.button"
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => {
                    setEditingOffer(undefined);
                    setOfferDialog(true);
                  }}
                >
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
              {offers.length === 0 ? (
                <div
                  data-ocid="restaurant_admin.offers.empty_state"
                  className="text-center py-12 text-[#A9B3BC]"
                >
                  No offers yet
                </div>
              ) : (
                <div className="space-y-2">
                  {offers.map((offer, idx) => (
                    <div
                      key={offer.id}
                      data-ocid={`restaurant_admin.offers.item.${idx + 1}`}
                      className="bg-[#1B2228] border border-[#2A333A] rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-white font-medium">
                          {offer.name}
                        </span>
                        <p className="text-[#A9B3BC] text-xs mt-0.5">
                          ₹{offer.price} • {offer.validDay} •{" "}
                          {offer.items.length} items
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#A9B3BC] hover:text-white"
                          onClick={() => {
                            setEditingOffer(offer);
                            setOfferDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteOffer(offer.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Announcements */}
          {activeSection === "announcements" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">
                Announcement
              </h2>
              <div className="bg-[#1B2228] border border-[#2A333A] rounded-xl p-4">
                <Label className="text-[#A9B3BC]">Announcement Text</Label>
                <Textarea
                  data-ocid="restaurant_admin.announcement.textarea"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  rows={4}
                  placeholder="e.g. Closed on Sunday, Special offer today..."
                  className="mt-2 bg-[#0F1418] border-[#2A333A] text-white resize-none"
                />
                <Button
                  data-ocid="restaurant_admin.announcement.save_button"
                  className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleSaveAnnouncement}
                >
                  Save Announcement
                </Button>
              </div>
            </div>
          )}

          {/* Restaurant Info */}
          {activeSection === "info" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">
                Restaurant Info
              </h2>
              <div className="bg-[#1B2228] border border-[#2A333A] rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#A9B3BC]">Phone</Label>
                    <Input
                      data-ocid="restaurant_admin.info.phone.input"
                      value={infoForm.phone || ""}
                      onChange={(e) =>
                        setInfoForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">WhatsApp</Label>
                    <Input
                      data-ocid="restaurant_admin.info.whatsapp.input"
                      value={infoForm.whatsapp || ""}
                      onChange={(e) =>
                        setInfoForm((f) => ({ ...f, whatsapp: e.target.value }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-[#A9B3BC]">Address</Label>
                    <Input
                      data-ocid="restaurant_admin.info.address.input"
                      value={infoForm.address || ""}
                      onChange={(e) =>
                        setInfoForm((f) => ({ ...f, address: e.target.value }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">Open Time</Label>
                    <Input
                      type="time"
                      value={infoForm.openTime || "09:00"}
                      onChange={(e) =>
                        setInfoForm((f) => ({ ...f, openTime: e.target.value }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">Close Time</Label>
                    <Input
                      type="time"
                      value={infoForm.closeTime || "22:00"}
                      onChange={(e) =>
                        setInfoForm((f) => ({
                          ...f,
                          closeTime: e.target.value,
                        }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">Emergency No</Label>
                    <Input
                      value={infoForm.emergencyNo || ""}
                      onChange={(e) =>
                        setInfoForm((f) => ({
                          ...f,
                          emergencyNo: e.target.value,
                        }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">Cyber Crime No</Label>
                    <Input
                      value={infoForm.cyberCrimeNo || ""}
                      onChange={(e) =>
                        setInfoForm((f) => ({
                          ...f,
                          cyberCrimeNo: e.target.value,
                        }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">UPI ID</Label>
                    <Input
                      value={infoForm.upiId || ""}
                      onChange={(e) =>
                        setInfoForm((f) => ({ ...f, upiId: e.target.value }))
                      }
                      placeholder="yourname@upi"
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">
                      Delivery Charge (₹)
                    </Label>
                    <Input
                      type="number"
                      value={infoForm.deliveryCharge || 0}
                      onChange={(e) =>
                        setInfoForm((f) => ({
                          ...f,
                          deliveryCharge: Number(e.target.value),
                        }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">Packing Charge (₹)</Label>
                    <Input
                      type="number"
                      value={infoForm.packingCharge || 0}
                      onChange={(e) =>
                        setInfoForm((f) => ({
                          ...f,
                          packingCharge: Number(e.target.value),
                        }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[#A9B3BC]">Platform Fee (₹)</Label>
                    <Input
                      type="number"
                      value={infoForm.platformFee || 0}
                      onChange={(e) =>
                        setInfoForm((f) => ({
                          ...f,
                          platformFee: Number(e.target.value),
                        }))
                      }
                      className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={infoForm.homeDeliveryAvailable || false}
                      onCheckedChange={(v) =>
                        setInfoForm((f) => ({
                          ...f,
                          homeDeliveryAvailable: v,
                        }))
                      }
                      id="ra-hd"
                    />
                    <Label htmlFor="ra-hd" className="text-[#A9B3BC]">
                      Home Delivery Available
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={infoForm.isActive !== false}
                      onCheckedChange={(v) =>
                        setInfoForm((f) => ({ ...f, isActive: v }))
                      }
                      id="ra-ia"
                    />
                    <Label htmlFor="ra-ia" className="text-[#A9B3BC]">
                      Active (visible on homepage)
                    </Label>
                  </div>
                </div>
                <Button
                  data-ocid="restaurant_admin.info.save_button"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleSaveInfo}
                  disabled={infoSaving}
                >
                  {infoSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Category Dialog */}
      <Dialog
        open={catDialog}
        onOpenChange={(o) => {
          setCatDialog(o);
          if (!o) setEditingCat(undefined);
        }}
      >
        <DialogContent className="bg-[#1B2228] border-[#2A333A] text-white">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            initial={editingCat}
            onSave={handleSaveCategory}
            onCancel={() => setCatDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Menu Item Dialog */}
      <Dialog
        open={itemDialog}
        onOpenChange={(o) => {
          setItemDialog(o);
          if (!o) setEditingItem(undefined);
        }}
      >
        <DialogContent className="bg-[#1B2228] border-[#2A333A] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <MenuItemForm
            initial={editingItem}
            categories={categories}
            onSave={handleSaveItem}
            onCancel={() => setItemDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog
        open={offerDialog}
        onOpenChange={(o) => {
          setOfferDialog(o);
          if (!o) setEditingOffer(undefined);
        }}
      >
        <DialogContent className="bg-[#1B2228] border-[#2A333A] text-white">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? "Edit Offer" : "Add Offer"}
            </DialogTitle>
          </DialogHeader>
          <OfferForm
            initial={editingOffer}
            menuItems={items}
            onSave={handleSaveOffer}
            onCancel={() => setOfferDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="bg-[#1B2228] border-[#2A333A] text-white">
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#A9B3BC]">Rejection Reason</Label>
              <Textarea
                data-ocid="restaurant_admin.reject.textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="mt-2 bg-[#0F1418] border-[#2A333A] text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                data-ocid="restaurant_admin.reject.cancel_button"
                variant="outline"
                className="flex-1 border-[#2A333A] text-[#A9B3BC]"
                onClick={() => setRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="restaurant_admin.reject.confirm_button"
                variant="destructive"
                className="flex-1"
                onClick={confirmReject}
              >
                Reject Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
