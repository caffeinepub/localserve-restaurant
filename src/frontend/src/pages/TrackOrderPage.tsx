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
import { ArrowLeft, CheckCircle, Clock, Package, XCircle } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurants } from "../hooks/useFirebase";
import { db } from "../lib/firebase";
import type { Order } from "../types";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "bg-blue-100 text-blue-700",
    icon: Package,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

export function TrackOrderPage() {
  const navigate = useNavigate();
  const { restaurants } = useRestaurants();
  const [restaurantId, setRestaurantId] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl text-gray-900">Track Your Order</h1>
      </div>

      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Enter Order Details</h2>
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
              placeholder="e.g. ORD-ABC123"
              className="mt-1"
            />
          </div>
          {error && (
            <p data-ocid="track.error_state" className="text-red-500 text-sm">
              {error}
            </p>
          )}
          <Button
            data-ocid="track.submit.button"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={trackOrder}
            disabled={loading}
          >
            {loading ? "Searching..." : "Track Order"}
          </Button>
        </div>

        {order && statusCfg && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order No</p>
                <p className="font-bold text-lg text-gray-900">
                  #{order.orderNo}
                </p>
              </div>
              <span
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${statusCfg.color}`}
              >
                <statusCfg.icon size={14} /> {statusCfg.label}
              </span>
            </div>
            <div className="border-t pt-4 text-sm space-y-1">
              <p className="text-gray-500">
                {new Date(order.timestamp).toLocaleString()}
              </p>
              <p className="font-medium">{order.restaurantName}</p>
              {order.orderType === "delivery" && (
                <p className="text-gray-600">{order.address}</p>
              )}
            </div>
            <div className="border-t pt-4">
              <p className="font-semibold text-sm mb-2">Items</p>
              {order.items.map((item, i) => (
                <div
                  key={`item-${item.itemId || i}`}
                  className="flex justify-between text-sm py-1"
                >
                  <span>
                    {item.name}
                    {item.variant ? ` (${item.variant})` : ""} ×{item.qty}
                  </span>
                  <span>₹{(item.price * item.qty).toFixed(0)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-orange-600">₹{order.total}</span>
              </div>
            </div>
            {order.status === "rejected" && order.rejectionReason && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-red-700 text-sm font-medium">
                  Rejection Reason:
                </p>
                <p className="text-red-600 text-sm mt-1">
                  {order.rejectionReason}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
