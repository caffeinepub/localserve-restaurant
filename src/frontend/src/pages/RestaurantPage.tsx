import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  Clock,
  MessageCircle,
  Phone,
  Shield,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnnouncementTicker } from "../components/AnnouncementTicker";
import { CartButton } from "../components/CartButton";
import { CartDrawer } from "../components/CartDrawer";
import { ImageSlider } from "../components/ImageSlider";
import { LiveTimer, getTimerStatus } from "../components/LiveTimer";
import { OrderFlow } from "../components/OrderFlow";
import { useCart } from "../context/CartContext";
import {
  useCategories,
  useMenuItems,
  useOffers,
  useRestaurant,
} from "../hooks/useFirebase";
import type { MenuItem } from "../types";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function VegBadge({ type }: { type: "veg" | "nonveg" }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-sm border-2 ${
        type === "veg" ? "border-green-600" : "border-red-600"
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          type === "veg" ? "bg-green-600" : "bg-red-600"
        }`}
      />
    </span>
  );
}

function MenuItemCard({ item, isOpen }: { item: MenuItem; isOpen: boolean }) {
  const { items: cartItems, addItem, updateQty } = useCart();
  const availableVariants = (["H", "M", "F"] as const).filter((v) =>
    v === "H"
      ? (item.halfPrice ?? 0) > 0
      : v === "M"
        ? (item.mediumPrice ?? 0) > 0
        : (item.fullPrice ?? 0) > 0,
  );
  const [selectedVariant, setSelectedVariant] = useState<
    "H" | "M" | "F" | "regular"
  >(availableVariants[0] ?? "H");
  const todayName = DAYS[new Date().getDay()];
  const dayOfferActive =
    item.dayOffer &&
    (item.dayOffer.day === todayName || item.dayOffer.day === "everyday");
  const effectivePrice =
    dayOfferActive && item.dayOffer
      ? item.dayOffer.price
      : item.hasHalfFull
        ? selectedVariant === "H"
          ? item.halfPrice
          : selectedVariant === "M"
            ? item.mediumPrice
            : item.fullPrice
        : item.price;

  function getVariantLabel() {
    if (!item.hasHalfFull || selectedVariant === "regular") return "";
    return selectedVariant;
  }

  const cartEntry = cartItems.find(
    (ci) => ci.itemId === item.id && ci.variant === (getVariantLabel() || ""),
  );
  const qty = cartEntry?.qty || 0;

  function handleAdd() {
    if (!isOpen) return;
    addItem({
      itemId: item.id,
      name: item.name,
      qty: 1,
      price: item.isFree ? 0 : effectivePrice,
      variant: getVariantLabel(),
    });
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex gap-3 p-3 transition-all ${
        item.isOutOfStock ? "opacity-60" : ""
      }`}
    >
      <div className="relative flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
            🍽️
          </div>
        )}
        {item.isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold text-center">
              Out of
              <br />
              Stock
            </span>
          </div>
        )}
        {item.bundleOffer && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {item.bundleOffer}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <VegBadge type={item.type} />
            <h4 className="font-semibold text-gray-800 text-sm truncate">
              {item.name}
            </h4>
          </div>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.hasHalfFull && (
          <div className="flex gap-1.5 mt-1.5">
            {availableVariants.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setSelectedVariant(v)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                  selectedVariant === v
                    ? "bg-orange-500 text-white border-orange-500"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                {v === "H" ? "Regular" : v === "M" ? "Medium" : "Full"}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            {item.isFree ? (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                FREE
              </span>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-gray-900">
                  ₹{effectivePrice}
                </span>
                {dayOfferActive && (
                  <span className="line-through text-gray-400 text-xs">
                    ₹{item.price}
                  </span>
                )}
              </div>
            )}
          </div>
          {!item.isOutOfStock &&
            isOpen &&
            (qty === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors"
              >
                ADD +
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQty(item.id, getVariantLabel(), -1)}
                  className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg leading-none transition-colors"
                >
                  −
                </button>
                <span className="font-bold text-gray-800 min-w-[1.5rem] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="w-7 h-7 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg leading-none transition-colors"
                >
                  +
                </button>
              </div>
            ))}
          {(!isOpen || item.isOutOfStock) && !item.isFree && (
            <span className="text-gray-400 text-xs">
              {item.isOutOfStock ? "Unavailable" : "Closed"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { restaurant, loading } = useRestaurant(id!);
  const { categories } = useCategories(id!);
  const { items } = useMenuItems(id!);
  const { offers } = useOffers(id!);
  const { items: cartItems, addItem, updateQty } = useCart();
  const [activeFilter, setActiveFilter] = useState<"all" | "veg" | "nonveg">(
    "all",
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const todayName = DAYS[new Date().getDay()];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-xl">Restaurant not found</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 text-orange-500 underline"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { status } = getTimerStatus(
    restaurant.openTime,
    restaurant.closeTime,
    restaurant.holidays || [],
  );
  const isOpen = status === "open" || status === "closing-soon";

  const todayOffers = offers.filter(
    (o) => o.validDay === "everyday" || o.validDay === todayName,
  );

  const filteredItems = items.filter((item) =>
    activeFilter === "all" ? true : item.type === activeFilter,
  );

  function scrollToCategory(catId: string) {
    categoryRefs.current[catId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function getOfferItemName(itemId: string) {
    return items.find((i) => i.id === itemId)?.name || "Item";
  }

  const offerCartEntry = (offerId: string) =>
    cartItems.find((ci) => ci.itemId === `offer-${offerId}`);

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement */}
      {restaurant.announcement && (
        <AnnouncementTicker text={restaurant.announcement} />
      )}

      {/* Back nav */}
      <div className="bg-white border-b sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          data-ocid="restaurant.back.button"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="font-black text-gray-900 text-xl flex-1 truncate">
          {restaurant.name}
        </h1>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isOpen ? "OPEN" : "CLOSED"}
        </span>
      </div>

      {/* Image Slider + Timer */}
      <div className="relative">
        <ImageSlider images={restaurant.images} />
        <div className="absolute top-4 right-4 z-20">
          <LiveTimer
            openTime={restaurant.openTime}
            closeTime={restaurant.closeTime}
            holidays={restaurant.holidays || []}
          />
        </div>
      </div>

      {/* Closed overlay */}
      {!isOpen && (
        <div className="fixed inset-0 z-20 bg-black/10 pointer-events-none" />
      )}

      <div className={`${!isOpen ? "pointer-events-none" : ""}`}>
        {/* Restaurant Info */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-5 sm:p-6 space-y-4">
            <p className="text-gray-600 leading-relaxed">
              {restaurant.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {restaurant.ownerName && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-orange-500 flex-shrink-0" />
                  <span className="text-gray-600">
                    Owner: <strong>{restaurant.ownerName}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-orange-500 flex-shrink-0" />
                <span className="text-gray-600">
                  {restaurant.openTime} – {restaurant.closeTime}
                </span>
              </div>
              {restaurant.homeDeliveryAvailable && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck size={16} className="text-green-500 flex-shrink-0" />
                  <span className="text-green-600 font-medium">
                    Home Delivery Available
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  data-ocid="restaurant.call.button"
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <Phone size={15} /> Call Us
                </a>
              )}
              {restaurant.whatsapp && (
                <a
                  href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello, I need help with my order at ${restaurant.name}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  data-ocid="restaurant.whatsapp.button"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
              {restaurant.emergencyNo && (
                <a
                  href={`tel:${restaurant.emergencyNo}`}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <AlertTriangle size={15} /> Emergency
                </a>
              )}
              {restaurant.cyberCrimeNo && (
                <a
                  href={`tel:${restaurant.cyberCrimeNo}`}
                  className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <Shield size={15} /> Cyber Crime
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Menu Heading */}
        <div className="max-w-4xl mx-auto px-4">
          <TypewriterHeading />

          {/* Veg/NonVeg Filter */}
          <div className="flex gap-2 mb-4">
            {(["all", "veg", "nonveg"] as const).map((f) => (
              <button
                type="button"
                key={f}
                data-ocid={`menu.${f}.tab`}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === f
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f === "veg" ? "🟢 Veg" : "🔴 Non-Veg"}
              </button>
            ))}
          </div>
        </div>

        {/* Special Offers */}
        {todayOffers.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Tag size={18} className="text-orange-500" /> Special Offers Today
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {todayOffers.map((offer) => {
                const entry = offerCartEntry(offer.id);
                const qty = entry?.qty || 0;
                return (
                  <div
                    key={offer.id}
                    className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          SPECIAL OFFER
                        </span>
                        <h4 className="font-bold text-gray-800 mt-1">
                          {offer.name}
                        </h4>
                      </div>
                      <span className="text-xl font-black text-orange-600">
                        ₹{offer.price}
                      </span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-0.5 mb-3">
                      {offer.items.map((oi, i) => (
                        <li key={String(i)}>
                          • {getOfferItemName(oi.itemId)} ×{oi.qty}
                        </li>
                      ))}
                    </ul>
                    {isOpen &&
                      (qty === 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            addItem({
                              itemId: `offer-${offer.id}`,
                              name: offer.name,
                              qty: 1,
                              price: offer.price,
                              variant: "Offer",
                            })
                          }
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(`offer-${offer.id}`, "Offer", -1)
                            }
                            className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold"
                          >
                            −
                          </button>
                          <span className="font-bold text-gray-800">{qty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              addItem({
                                itemId: `offer-${offer.id}`,
                                name: offer.name,
                                qty: 1,
                                price: offer.price,
                                variant: "Offer",
                              })
                            }
                            className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  data-ocid="menu.category.tab"
                  onClick={() => scrollToCategory(cat.id)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items by Category */}
        <div className="max-w-4xl mx-auto px-4 pb-32">
          {categories.map((cat) => {
            const catItems = filteredItems.filter(
              (item) => item.categoryId === cat.id,
            );
            if (catItems.length === 0) return null;
            return (
              <div
                key={cat.id}
                ref={(el) => {
                  categoryRefs.current[cat.id] = el;
                }}
                className="mb-8"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {cat.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cat.type === "veg"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cat.type === "veg" ? "🟢 Veg" : "🔴 Non-Veg"}
                    </span>
                  </div>
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm flex-shrink-0"
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {catItems.map((item, idx) => (
                    <div key={item.id} data-ocid={`menu.item.${idx + 1}`}>
                      <MenuItemCard item={item} isOpen={isOpen} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && categories.length === 0 && (
            <div
              data-ocid="menu.empty_state"
              className="text-center py-16 text-gray-400"
            >
              <p>No menu items available yet</p>
            </div>
          )}
        </div>
      </div>

      <CartButton onClick={() => setCartOpen(true)} isOpen={cartOpen} />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onOrder={() => {
          setCartOpen(false);
          setOrderOpen(true);
        }}
        restaurant={restaurant}
      />
      {orderOpen && (
        <OrderFlow
          open={orderOpen}
          onClose={() => setOrderOpen(false)}
          restaurant={restaurant}
        />
      )}
    </div>
  );
}

function TypewriterHeading() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "erasing">("typing");
  const full = "Our Menu";

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (text.length < full.length) {
        timeout = setTimeout(
          () => setText(full.slice(0, text.length + 1)),
          100,
        );
      } else {
        timeout = setTimeout(() => setPhase("erasing"), 1500);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), 60);
      } else {
        timeout = setTimeout(() => setPhase("typing"), 500);
      }
    }
    return () => clearTimeout(timeout);
  }, [text, phase]);

  return (
    <h2 className="text-3xl font-black text-gray-900 mb-4">
      {text}
      <span className="animate-pulse text-orange-500">|</span>
    </h2>
  );
}
