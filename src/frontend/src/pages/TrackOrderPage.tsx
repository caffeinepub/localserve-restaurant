import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { get, ref } from "firebase/database";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  Search,
  Timer,
  XCircle,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurants } from "../hooks/useFirebase";
import { db } from "../lib/firebase";
import type { Order } from "../types";

const STATUS_CONFIG = {
  pending: {
    label: "Order Placed - Waiting for Confirmation",
    color: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    icon: Clock,
    emoji: "⏳",
  },
  accepted: {
    label: "Order Accepted",
    color: "bg-blue-100 text-blue-700 border border-blue-200",
    icon: Package,
    emoji: "✅",
  },
  delivered: {
    label: "Delivered / Completed",
    color: "bg-green-100 text-green-700 border border-green-200",
    icon: CheckCircle,
    emoji: "🎉",
  },
  rejected: {
    label: "Order Cancelled",
    color: "bg-red-100 text-red-700 border border-red-200",
    icon: XCircle,
    emoji: "❌",
  },
};

function useCountdown(targetMs: number | null) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!targetMs) {
      setRemaining(null);
      return;
    }
    const tick = () => {
      const diff = targetMs - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return remaining;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Should arrive soon!";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  if (mins > 0) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  return "Just now";
}

// Parse delivery time string like "30 minutes", "1 hour", "45 mins" etc into ms
function parseDeliveryTimeMs(
  deliveryTime: string,
  acceptedAt?: number,
): number | null {
  if (!deliveryTime || !acceptedAt) return null;
  const lower = deliveryTime.toLowerCase();
  let totalMin = 0;
  const hourMatch = lower.match(/(\d+)\s*h/);
  const minMatch = lower.match(/(\d+)\s*m/);
  if (hourMatch) totalMin += Number.parseInt(hourMatch[1]) * 60;
  if (minMatch) totalMin += Number.parseInt(minMatch[1]);
  if (totalMin === 0) {
    const num = Number.parseInt(lower);
    if (!Number.isNaN(num)) totalMin = num;
  }
  if (totalMin === 0) return null;
  return acceptedAt + totalMin * 60 * 1000;
}

export function TrackOrderPage() {
  const navigate = useNavigate();
  const { restaurants } = useRestaurants();
  const [restaurantId, setRestaurantId] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const countdownTarget =
    order?.status === "accepted" && order.deliveryTime && order.acceptedAt
      ? parseDeliveryTimeMs(order.deliveryTime, order.acceptedAt)
      : null;
  const remaining = useCountdown(countdownTarget);

  async function trackOrder() {
    if (!restaurantId || !orderNo.trim()) {
      setError("Please select a restaurant and enter an order number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const snap = await get(ref(db, `orders/${restaurantId}`));
      const data = snap.val() || {};
      const found = Object.entries(data).find(
        ([, v]: [string, any]) => v.orderNo === orderNo.trim(),
      );
      if (found) {
        const [id, v] = found as [string, any];
        setOrder({
          id,
          restaurantId,
          ...v,
          items: v.items ? Object.values(v.items) : [],
          deliveryTime: v.deliveryTime || undefined,
          acceptedAt: v.acceptedAt || undefined,
        });
      } else {
        setError("Order not found. Please check the order number.");
        setOrder(null);
      }
    } catch {
      setError("Failed to fetch order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const statusCfg = order
    ? STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ||
      STATUS_CONFIG.pending
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl text-gray-900">Track Your Order</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Search size={18} className="text-orange-500" />
            <h2 className="font-semibold text-gray-700">Enter Order Details</h2>
          </div>
          <div>
            <Label>Select Restaurant</Label>
            <Select value={restaurantId} onValueChange={setRestaurantId}>
              <SelectTrigger
                data-ocid="track.restaurant.select"
                className="mt-1"
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
          <div>
            <Label htmlFor="ordno">Order Number</Label>
            <Input
              data-ocid="track.order.input"
              id="ordno"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && trackOrder()}
              placeholder="e.g. ORD-ABC123"
              className="mt-1"
            />
          </div>
          {error && (
            <p
              data-ocid="track.error_state"
              className="text-red-500 text-sm bg-red-50 p-3 rounded-xl"
            >
              {error}
            </p>
          )}
          <Button
            data-ocid="track.submit.button"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
            onClick={trackOrder}
            disabled={loading}
          >
            {loading ? "Searching..." : "🔍 Track Order"}
          </Button>
        </div>

        {/* Order Result */}
        {order && statusCfg && (
          <div className="space-y-3">
            {/* Status Card */}
            <div className={`rounded-2xl p-5 ${statusCfg.color}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{statusCfg.emoji}</span>
                <div>
                  <p className="text-xs font-medium opacity-70 uppercase tracking-wide">
                    Order Status
                  </p>
                  <p className="font-bold text-lg">{statusCfg.label}</p>
                  <p className="text-sm opacity-70">#{order.orderNo}</p>
                </div>
              </div>
            </div>

            {/* Countdown Timer - shown when accepted with delivery time */}
            {order.status === "accepted" && order.deliveryTime && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Timer size={20} className="text-orange-600" />
                  <h3 className="font-bold text-orange-800">
                    Estimated Delivery
                  </h3>
                </div>
                <p className="text-sm text-orange-700 mb-2">
                  Estimated time: <strong>{order.deliveryTime}</strong>
                </p>
                {countdownTarget && remaining !== null ? (
                  <div className="bg-white rounded-xl p-3 text-center border border-orange-100">
                    {remaining > 0 ? (
                      <>
                        <p className="text-xs text-gray-500 mb-1">
                          Time Remaining
                        </p>
                        <p className="text-3xl font-black text-orange-600 font-mono tracking-wider">
                          {formatCountdown(remaining)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Your order is being prepared 🍳
                        </p>
                      </>
                    ) : (
                      <p className="text-orange-600 font-bold text-lg">
                        🚚 Should arrive any moment!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-3 text-center border border-orange-100">
                    <p className="text-orange-700 font-medium">
                      🚚 Your order is on its way!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rejection Reason - shown prominently */}
            {order.status === "rejected" && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={20} className="text-red-600" />
                  <h3 className="font-bold text-red-700">
                    Order Cancelled by Restaurant
                  </h3>
                </div>
                {order.rejectionReason ? (
                  <div className="bg-white rounded-xl p-3 border border-red-100">
                    <p className="text-xs text-red-500 font-medium mb-1">
                      Reason:
                    </p>
                    <p className="text-red-700 font-medium">
                      {order.rejectionReason}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">
                    The restaurant has cancelled your order. Please contact the
                    restaurant for more details.
                  </p>
                )}
              </div>
            )}

            {/* Order Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
              <h3 className="font-bold text-gray-800 text-base border-b pb-2">
                Order Details
              </h3>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Ordered</p>
                  <p className="font-semibold text-gray-800">
                    {timeAgo(order.timestamp)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {new Date(order.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Order Type</p>
                  <p className="font-semibold text-gray-800">
                    {order.orderType === "delivery"
                      ? "🚚 Home Delivery"
                      : "🍽️ Dine-In"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Payment</p>
                  <p className="font-semibold text-gray-800">
                    {order.paymentMethod === "online"
                      ? "💳 Online"
                      : "💵 Cash (COD)"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-500 text-xs">Restaurant</p>
                  <p className="font-semibold text-gray-800 text-xs leading-tight">
                    {order.restaurantName}
                  </p>
                </div>
              </div>

              {/* Customer info */}
              {order.customerName && (
                <div className="text-sm">
                  <p className="text-gray-500 text-xs mb-1">Customer</p>
                  <p className="font-medium text-gray-800">
                    {order.customerName}
                  </p>
                  {order.orderType === "delivery" && order.address && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      📍 {order.address}
                    </p>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <p className="font-semibold text-sm text-gray-700 mb-2">
                  Items Ordered
                </p>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div
                      key={`item-${item.itemId || i}`}
                      className="bg-gray-50 rounded-xl p-3"
                    >
                      <div className="flex justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">
                            {item.name}
                            {item.variant ? ` (${item.variant})` : ""}
                          </span>
                          <span className="text-gray-500 ml-1">
                            × {item.qty}
                          </span>
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.addons.map((addon, ai) => (
                                <p
                                  key={String(ai)}
                                  className="text-xs text-gray-500"
                                >
                                  + {addon.name}: ₹{addon.price}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-gray-800 ml-2">
                          ₹{(item.price * item.qty).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill breakdown */}
              <div className="border-t pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                {order.deliveryCharge > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Charge</span>
                    <span>₹{order.deliveryCharge}</span>
                  </div>
                )}
                {order.packingCharge > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Packing Charge</span>
                    <span>₹{order.packingCharge}</span>
                  </div>
                )}
                {order.platformFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span>₹{order.platformFee}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base border-t pt-2">
                  <span>Total Amount</span>
                  <span className="text-orange-600">₹{order.total}</span>
                </div>
              </div>
            </div>

            {/* Refresh button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={trackOrder}
              disabled={loading}
            >
              🔄 Refresh Status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
