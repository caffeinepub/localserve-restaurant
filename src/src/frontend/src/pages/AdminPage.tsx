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
  ChevronRight,
  Download,
  Edit,
  Eye,
  EyeOff,
  LayoutDashboard,
  List,
  LogOut,
  Megaphone,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  deleteCategory,
  deleteMenuItem,
  deleteOffer,
  deleteRestaurant,
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

// ---- Login Gate ----
function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  function submit() {
    if (pw === "Paramjeet1$1") onLogin();
    else setErr("Incorrect password");
  }
  return (
    <div className="min-h-screen bg-[#0F1418] flex items-center justify-center px-4">
      <div className="bg-[#1B2228] rounded-2xl border border-[#2A333A] p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Admin Panel</h1>
          <p className="text-[#A9B3BC] text-sm mt-1">
            Enter password to continue
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-[#A9B3BC]">Password</Label>
            <Input
              data-ocid="admin.password.input"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Enter admin password"
              className="mt-1 bg-[#0F1418] border-[#2A333A] text-white"
            />
          </div>
          {err && (
            <p
              data-ocid="admin.password.error"
              className="text-red-400 text-sm"
            >
              {err}
            </p>
          )}
          <Button
            data-ocid="admin.login.button"
            onClick={submit}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Restaurant Form ----
// ---- Admin Password Input (show/hide toggle) ----
function AdminPasswordInput({
  value,
  onChange,
}: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative mt-1">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Set a password for this restaurant's owner"
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function RestaurantForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Restaurant>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Restaurant>>(
    initial || {
      name: "",
      description: "",
      ownerName: "",
      phone: "",
      whatsapp: "",
      address: "",
      openTime: "09:00",
      closeTime: "22:00",
      homeDeliveryAvailable: false,
      deliveryCharge: 0,
      packingCharge: 0,
      platformFee: 0,
      emergencyNo: "",
      cyberCrimeNo: "",
      isActive: true,
      images: [],
      holidays: [],
      announcement: "",
      upiId: "",
      adminPassword: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const [holidayInput, setHolidayInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  async function handleCoverImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setForm((f) => ({ ...f, coverImage: b64 }));
  }

  async function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const b64s = await Promise.all(files.map(fileToBase64));
    setForm((f) => ({ ...f, images: [...(f.images || []), ...b64s] }));
  }

  function removeImage(idx: number) {
    setForm((f) => ({
      ...f,
      images: (f.images || []).filter((_, i) => i !== idx),
    }));
  }

  function addHoliday() {
    if (!holidayInput) return;
    setForm((f) => ({ ...f, holidays: [...(f.holidays || []), holidayInput] }));
    setHolidayInput("");
  }

  async function handleSave() {
    if (!form.name?.trim()) {
      toast.error("Restaurant name is required");
      return;
    }
    setSaving(true);
    try {
      await saveRestaurant(form);
      toast.success("Restaurant saved!");
      onSave();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const F = (k: keyof Restaurant) => ({
    value: (form[k] as string) || "",
    onChange: (e: any) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Name *</Label>
          <Input {...F("name")} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Description</Label>
          <Textarea {...F("description")} className="mt-1" rows={2} />
        </div>
        <div>
          <Label>Owner Name(s)</Label>
          <Input
            {...F("ownerName")}
            placeholder="Comma separated"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...F("phone")} className="mt-1" />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input {...F("whatsapp")} className="mt-1" />
        </div>
        <div>
          <Label>Address</Label>
          <Input {...F("address")} className="mt-1" />
        </div>
        <div>
          <Label>Open Time</Label>
          <Input type="time" {...F("openTime")} className="mt-1" />
        </div>
        <div>
          <Label>Close Time</Label>
          <Input type="time" {...F("closeTime")} className="mt-1" />
        </div>
        <div>
          <Label>Emergency No</Label>
          <Input {...F("emergencyNo")} className="mt-1" />
        </div>
        <div>
          <Label>Cyber Crime No</Label>
          <Input {...F("cyberCrimeNo")} className="mt-1" />
        </div>
        <div>
          <Label>UPI ID (for online payments)</Label>
          <Input
            {...F("upiId")}
            placeholder="yourname@upi or number@bank"
            className="mt-1"
          />
          <p className="text-xs text-gray-400 mt-1">
            e.g. 9876543210@paytm, shop@ybl, abc@okaxis
          </p>
          <div>
            <Label>Restaurant Admin Password</Label>
            <AdminPasswordInput
              value={(form.adminPassword as string) || ""}
              onChange={(v) => setForm((f) => ({ ...f, adminPassword: v }))}
            />
            <p className="text-xs text-gray-400 mt-1">
              Restaurant owner will use this password to login to their panel
            </p>
          </div>
        </div>
        <div>
          <Label>Delivery Charge</Label>
          <Input
            type="number"
            value={form.deliveryCharge || 0}
            onChange={(e) =>
              setForm((f) => ({ ...f, deliveryCharge: Number(e.target.value) }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label>Packing Charge</Label>
          <Input
            type="number"
            value={form.packingCharge || 0}
            onChange={(e) =>
              setForm((f) => ({ ...f, packingCharge: Number(e.target.value) }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label>Platform Fee</Label>
          <Input
            type="number"
            value={form.platformFee || 0}
            onChange={(e) =>
              setForm((f) => ({ ...f, platformFee: Number(e.target.value) }))
            }
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.homeDeliveryAvailable || false}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, homeDeliveryAvailable: v }))
          }
          id="hd"
        />
        <Label htmlFor="hd">Home Delivery Available</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.isActive !== false}
          onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          id="ia"
        />
        <Label htmlFor="ia">Active (visible on homepage)</Label>
      </div>
      {/* Cover Image */}
      <div>
        <Label>Cover Image</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverImage}
        />
        <div className="mt-1 flex items-center gap-3">
          {form.coverImage && (
            <img
              src={form.coverImage}
              alt="cover"
              className="w-20 h-14 object-cover rounded-lg"
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
      {/* Gallery Images */}
      <div>
        <Label>Gallery Images (Slider)</Label>
        <input
          ref={imagesRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImages}
        />
        <div className="mt-1 flex flex-wrap gap-2">
          {(form.images || []).map((img, i) => (
            <div key={String(i)} className="relative">
              <img
                src={img}
                alt=""
                className="w-16 h-16 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => imagesRef.current?.click()}
            className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
      {/* Holidays */}
      <div>
        <Label>Holiday Dates</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="date"
            value={holidayInput}
            onChange={(e) => setHolidayInput(e.target.value)}
          />
          <Button variant="outline" onClick={addHoliday}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {(form.holidays || []).map((h, i) => (
            <span
              key={String(i)}
              className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"
            >
              {h}{" "}
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    holidays: (f.holidays || []).filter((_, j) => j !== i),
                  }))
                }
                className="hover:text-red-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ---- Main Admin Page ----
export function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const { restaurants } = useRestaurants();
  const { categories } = useCategories(selectedRestaurantId);
  const { items } = useMenuItems(selectedRestaurantId);
  const { offers } = useOffers(selectedRestaurantId);
  const { orders } = useOrders(selectedRestaurantId || undefined);

  // Dialog states
  const [restDialog, setRestDialog] = useState(false);
  const [editingRest, setEditingRest] = useState<Restaurant | undefined>();
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | undefined>();
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();
  const [offerDialog, setOfferDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | undefined>();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [acceptDialog, setAcceptDialog] = useState(false);
  const [acceptOrderId, setAcceptOrderId] = useState("");
  const [acceptRestaurantId, setAcceptRestaurantId] = useState("");
  const [deliveryTimeInput, setDeliveryTimeInput] = useState("30 minutes");
  const [announcementText, setAnnouncementText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "restaurants", label: "Restaurants", icon: Store },
    { id: "categories", label: "Categories", icon: List },
    { id: "items", label: "Menu Items", icon: Package },
    { id: "offers", label: "Special Offers", icon: Tag },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ];

  const selectedRestaurant = restaurants.find(
    (r) => r.id === selectedRestaurantId,
  );

  function exportOrders() {
    let filtered = orders;
    if (dateFrom)
      filtered = filtered.filter(
        (o) => o.timestamp >= new Date(dateFrom).getTime(),
      );
    if (dateTo)
      filtered = filtered.filter(
        (o) => o.timestamp <= new Date(`${dateTo}T23:59:59`).getTime(),
      );
    const rows = filtered.map((o) => ({
      "Order No": o.orderNo,
      Customer: o.customerName,
      Phone: o.phone,
      Address: o.address,
      Type: o.orderType,
      Items: o.items.map((i: any) => `${i.name}x${i.qty}`).join(", "),
      Total: o.total,
      Payment: o.paymentMethod,
      Status: o.status,
      Date: new Date(o.timestamp).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(
      wb,
      `Orders-${selectedRestaurant?.name || "All"}-${Date.now()}.xlsx`,
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0F1418] min-h-screen flex flex-col fixed left-0 top-0 z-30 hidden lg:flex">
        <div className="px-5 py-5 border-b border-[#2A333A]">
          <span className="text-xl font-black text-white">
            Local<span className="text-orange-500">Serve</span>
          </span>
          <p className="text-[#A9B3BC] text-xs mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={`admin.${item.id}.tab`}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? "bg-orange-500/15 text-orange-400 border-r-2 border-orange-500"
                  : "text-[#A9B3BC] hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={17} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#2A333A]">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[#A9B3BC] border-[#2A333A]"
            onClick={() => {
              setAuthed(false);
              navigate("/");
            }}
          >
            <LogOut size={15} className="mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile nav tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0F1418] border-t border-[#2A333A] flex overflow-x-auto">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors ${
              activeSection === item.id ? "text-orange-400" : "text-[#A9B3BC]"
            }`}
          >
            <item.icon size={18} />
            {item.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 lg:ml-60 p-4 sm:p-6 pb-20 lg:pb-6">
        {/* Restaurant selector (shown for relevant sections) */}
        {["categories", "items", "offers", "orders", "announcements"].includes(
          activeSection,
        ) && (
          <div className="mb-5">
            <Label className="text-gray-700">Select Restaurant</Label>
            <Select
              value={selectedRestaurantId}
              onValueChange={setSelectedRestaurantId}
            >
              <SelectTrigger
                data-ocid="admin.restaurant.select"
                className="mt-1 max-w-xs"
              >
                <SelectValue placeholder="Choose restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Restaurants",
                  value: restaurants.length,
                  color: "bg-blue-500",
                },
                {
                  label: "Total Orders",
                  value: orders.length,
                  color: "bg-orange-500",
                },
                {
                  label: "Pending",
                  value: orders.filter((o) => o.status === "pending").length,
                  color: "bg-yellow-500",
                },
                {
                  label: "Delivered",
                  value: orders.filter((o) => o.status === "delivered").length,
                  color: "bg-green-500",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                >
                  <div
                    className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}
                  >
                    <span className="text-white font-black text-lg">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {orders.slice(0, 10).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        #{o.orderNo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {o.restaurantName} &bull; {o.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {o.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">₹{o.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Restaurants */}
        {activeSection === "restaurants" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Restaurants</h2>
              <Button
                data-ocid="admin.restaurant.add.button"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  setEditingRest(undefined);
                  setRestDialog(true);
                }}
              >
                <Plus size={16} className="mr-2" /> Add
              </Button>
            </div>
            <div className="grid gap-4">
              {restaurants.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                >
                  {r.coverImage && (
                    <img
                      src={r.coverImage}
                      alt=""
                      className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate">
                        {r.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm truncate">
                      {r.address}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      data-ocid="admin.restaurant.edit.button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRest(r);
                        setRestDialog(true);
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      data-ocid="admin.restaurant.delete.button"
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={async () => {
                        if (confirm("Delete this restaurant?")) {
                          await deleteRestaurant(r.id);
                          toast.success("Deleted");
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Dialog open={restDialog} onOpenChange={setRestDialog}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRest ? "Edit Restaurant" : "Add Restaurant"}
                  </DialogTitle>
                </DialogHeader>
                <RestaurantForm
                  initial={editingRest}
                  onSave={() => setRestDialog(false)}
                  onCancel={() => setRestDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Categories */}
        {activeSection === "categories" && selectedRestaurantId && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
              <Button
                data-ocid="admin.category.add.button"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  setEditingCat(undefined);
                  setCatDialog(true);
                }}
              >
                <Plus size={16} className="mr-2" /> Add
              </Button>
            </div>
            <div className="grid gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${cat.type === "veg" ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {cat.type} &bull; Order: {cat.order}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCat(cat);
                        setCatDialog(true);
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500"
                      onClick={async () => {
                        await deleteCategory(selectedRestaurantId, cat.id);
                        toast.success("Deleted");
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Dialog open={catDialog} onOpenChange={setCatDialog}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>
                    {editingCat ? "Edit Category" : "Add Category"}
                  </DialogTitle>
                </DialogHeader>
                <CategoryForm
                  initial={editingCat}
                  onSave={async (data) => {
                    await saveCategory(selectedRestaurantId, data);
                    toast.success("Saved");
                    setCatDialog(false);
                  }}
                  onCancel={() => setCatDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Menu Items */}
        {activeSection === "items" && selectedRestaurantId && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
              <Button
                data-ocid="admin.item.add.button"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  setEditingItem(undefined);
                  setItemDialog(true);
                }}
              >
                <Plus size={16} className="mr-2" /> Add
              </Button>
            </div>
            <div className="grid gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${item.type === "veg" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <p className="font-semibold text-gray-800 truncate">
                        {item.name}
                      </p>
                      {item.isOutOfStock && (
                        <Badge variant="secondary" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                      {item.isFree && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          Free
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">
                      ₹{item.price}
                      {item.hasHalfFull
                        ? ` / R:₹${item.halfPrice} M:₹${item.mediumPrice} F:₹${item.fullPrice}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item);
                        setItemDialog(true);
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500"
                      onClick={async () => {
                        await deleteMenuItem(selectedRestaurantId, item.id);
                        toast.success("Deleted");
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Dialog open={itemDialog} onOpenChange={setItemDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Item" : "Add Item"}
                  </DialogTitle>
                </DialogHeader>
                <MenuItemForm
                  key={editingItem?.id || "new"}
                  initial={editingItem}
                  categories={categories}
                  onSave={async (data) => {
                    await saveMenuItem(selectedRestaurantId, data);
                    toast.success("Saved");
                    setItemDialog(false);
                  }}
                  onCancel={() => setItemDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Special Offers */}
        {activeSection === "offers" && selectedRestaurantId && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900">
                Special Offers
              </h2>
              <Button
                data-ocid="admin.offer.add.button"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => {
                  setEditingOffer(undefined);
                  setOfferDialog(true);
                }}
              >
                <Plus size={16} className="mr-2" /> Add
              </Button>
            </div>
            <div className="grid gap-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{offer.name}</p>
                    <p className="text-sm text-gray-500">
                      ₹{offer.price} &bull; {offer.validDay} &bull;{" "}
                      {offer.items.length} items
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingOffer(offer);
                        setOfferDialog(true);
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500"
                      onClick={async () => {
                        await deleteOffer(selectedRestaurantId, offer.id);
                        toast.success("Deleted");
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Dialog open={offerDialog} onOpenChange={setOfferDialog}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingOffer ? "Edit Offer" : "Add Offer"}
                  </DialogTitle>
                </DialogHeader>
                <OfferForm
                  initial={editingOffer}
                  menuItems={items}
                  onSave={async (data) => {
                    await saveOffer(selectedRestaurantId, data);
                    toast.success("Saved");
                    setOfferDialog(false);
                  }}
                  onCancel={() => setOfferDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Orders */}
        {activeSection === "orders" && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input
                    data-ocid="admin.orders.from.input"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-0.5 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input
                    data-ocid="admin.orders.to.input"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-0.5 h-8 text-sm"
                  />
                </div>
                <Button
                  data-ocid="admin.orders.export.button"
                  variant="outline"
                  onClick={exportOrders}
                >
                  <Download size={15} className="mr-2" /> Export Excel
                </Button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {[
                        "Order No",
                        "Customer",
                        "Items",
                        "Total",
                        "Type",
                        "Payment",
                        "Status",
                        "Date",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((o) => {
                        if (
                          dateFrom &&
                          o.timestamp < new Date(dateFrom).getTime()
                        )
                          return false;
                        if (
                          dateTo &&
                          o.timestamp > new Date(`${dateTo}T23:59:59`).getTime()
                        )
                          return false;
                        return true;
                      })
                      .map((o, idx) => (
                        <tr
                          key={o.id}
                          data-ocid={`orders.row.${idx + 1}`}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-bold text-orange-600">
                            #{o.orderNo}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{o.customerName}</p>
                            <p className="text-xs text-gray-400">{o.phone}</p>
                          </td>
                          <td className="px-4 py-3 max-w-[150px]">
                            <p className="truncate text-xs text-gray-600">
                              {o.items
                                ?.map((i: any) => `${i.name}x${i.qty}`)
                                .join(", ")}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-bold">₹{o.total}</td>
                          <td className="px-4 py-3 capitalize text-xs">
                            {o.orderType}
                          </td>
                          <td className="px-4 py-3 capitalize text-xs">
                            {o.paymentMethod}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(o.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {o.status === "pending" && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  data-ocid="orders.accept.button"
                                  onClick={() => {
                                    if (o.orderType === "delivery") {
                                      setAcceptOrderId(o.id);
                                      setAcceptRestaurantId(
                                        selectedRestaurantId || o.restaurantId,
                                      );
                                      setDeliveryTimeInput("30 minutes");
                                      setAcceptDialog(true);
                                    } else {
                                      updateOrderStatus(
                                        selectedRestaurantId || o.restaurantId,
                                        o.id,
                                        "accepted",
                                      ).then(() => toast.success("Accepted!"));
                                    }
                                  }}
                                  className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                  title="Accept"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  data-ocid="orders.reject.button"
                                  onClick={() => {
                                    setRejectOrderId(o.id);
                                    setRejectDialog(true);
                                  }}
                                  className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                  title="Reject"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                            {o.status === "accepted" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateOrderStatus(
                                    selectedRestaurantId || o.restaurantId,
                                    o.id,
                                    "delivered",
                                  ).then(() =>
                                    toast.success("Marked delivered!"),
                                  )
                                }
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg"
                              >
                                Delivered
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <div
                    data-ocid="orders.empty_state"
                    className="text-center py-12 text-gray-400"
                  >
                    No orders found
                  </div>
                )}
              </div>
            </div>
            {/* Reject Dialog */}
            <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
              <DialogContent
                className="max-w-sm"
                data-ocid="orders.reject.dialog"
              >
                <DialogHeader>
                  <DialogTitle>Reject Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Label>Rejection Reason</Label>
                  <Textarea
                    data-ocid="orders.reject.textarea"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Why is this order being rejected?"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      data-ocid="orders.reject.cancel.button"
                      onClick={() => setRejectDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      data-ocid="orders.reject.confirm.button"
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      onClick={async () => {
                        if (!rejectReason.trim()) {
                          toast.error("Please enter a reason");
                          return;
                        }
                        await updateOrderStatus(
                          selectedRestaurantId,
                          rejectOrderId,
                          "rejected",
                          rejectReason,
                        );
                        toast.success("Order rejected");
                        setRejectDialog(false);
                        setRejectReason("");
                      }}
                    >
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {/* Accept Dialog with Delivery Time */}
            <Dialog open={acceptDialog} onOpenChange={setAcceptDialog}>
              <DialogContent
                className="max-w-sm"
                data-ocid="orders.accept.dialog"
              >
                <DialogHeader>
                  <DialogTitle>Accept Order & Set Delivery Time</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Set the estimated delivery time for this home delivery
                    order. The customer will see this message.
                  </p>
                  <div>
                    <Label>Estimated Delivery Time</Label>
                    <Input
                      value={deliveryTimeInput}
                      onChange={(e) => setDeliveryTimeInput(e.target.value)}
                      placeholder="e.g. 30 minutes, 45 minutes, 1 hour"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      data-ocid="orders.accept.cancel.button"
                      onClick={() => setAcceptDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      data-ocid="orders.accept.confirm.button"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        await updateOrderStatus(
                          acceptRestaurantId,
                          acceptOrderId,
                          "accepted",
                          undefined,
                          deliveryTimeInput.trim() || "30 minutes",
                        );
                        toast.success("Order accepted! Delivery time set.");
                        setAcceptDialog(false);
                      }}
                    >
                      Accept & Set Time
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Announcements */}
        {activeSection === "announcements" && selectedRestaurantId && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">
              Announcement
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-600 mb-3">
                This text will scroll on the restaurant page as an announcement
                ticker.
              </p>
              <Textarea
                data-ocid="admin.announcement.textarea"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Enter announcement text... e.g. Special discount on weekends! Free delivery above ₹500!"
                rows={4}
                className="mb-4"
              />
              {selectedRestaurant?.announcement && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-600 font-medium">
                    Current announcement:
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    {selectedRestaurant.announcement}
                  </p>
                </div>
              )}
              <Button
                data-ocid="admin.announcement.save.button"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={async () => {
                  await saveAnnouncement(
                    selectedRestaurantId,
                    announcementText,
                  );
                  toast.success("Announcement saved!");
                }}
              >
                Save Announcement
              </Button>
            </div>
          </div>
        )}

        {/* Require restaurant selection */}
        {["categories", "items", "offers", "announcements"].includes(
          activeSection,
        ) &&
          !selectedRestaurantId && (
            <div className="text-center py-16 text-gray-400">
              <Store size={48} className="mx-auto mb-4 opacity-30" />
              <p>Please select a restaurant above to manage {activeSection}</p>
            </div>
          )}
      </main>
    </div>
  );
}

// ---- Sub-forms ----
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
    image: initial?.image || "",
  });
  const catFileRef = useRef<HTMLInputElement>(null);

  async function handleCatImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setForm((f) => ({ ...f, image: b64 }));
  }

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
      <div>
        <Label>Category Image (optional)</Label>
        <div className="mt-1 flex items-center gap-3">
          {form.image && (
            <img
              src={form.image}
              alt="Category"
              className="w-16 h-16 object-cover rounded-lg border"
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => catFileRef.current?.click()}
          >
            {form.image ? "Change Photo" : "Upload Photo"}
          </Button>
          {form.image && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500"
              onClick={() => setForm((f) => ({ ...f, image: "" }))}
            >
              Remove
            </Button>
          )}
        </div>
        <input
          ref={catFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCatImage}
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
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={form.hasHalfFull || false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, hasHalfFull: v }))}
            id="hhf"
          />
          <Label htmlFor="hhf">R/M/F Variants</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.isFree || false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isFree: v }))}
            id="ifr"
          />
          <Label htmlFor="ifr">Free</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.isOutOfStock || false}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isOutOfStock: v }))}
            id="ios"
          />
          <Label htmlFor="ios">Out of Stock</Label>
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
      {/* Day Offer */}
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
            placeholder="Offer price"
            value={dayOfferPrice}
            onChange={(e) => setDayOfferPrice(Number(e.target.value))}
          />
        </div>
      </div>
      {/* Image */}
      <div>
        <Label>Item Image</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImage}
        />
        <div className="flex items-center gap-3 mt-1">
          {form.image && (
            <img
              src={form.image}
              alt=""
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
