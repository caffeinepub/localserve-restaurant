import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2 } from "lucide-react";
import React from "react";
import { useCart } from "../context/CartContext";
import type { Restaurant } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onOrder: () => void;
  restaurant: Restaurant;
}

export function CartDrawer({ open, onClose, onOrder, restaurant }: Props) {
  const { items, updateQty, removeItem, totalPrice } = useCart();
  const deliveryCharge = restaurant.deliveryCharge || 0;
  const packingCharge = restaurant.packingCharge || 0;
  const platformFee = restaurant.platformFee || 0;
  const grandTotal = totalPrice + deliveryCharge + packingCharge + platformFee;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
        data-ocid="cart.sheet"
      >
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-500" /> Your Cart
          </SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div
            data-ocid="cart.empty_state"
            className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400"
          >
            <ShoppingCart size={48} className="opacity-30" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item, i) => (
                <div
                  key={`${item.itemId}-${item.variant}`}
                  data-ocid={`cart.item.${i + 1}`}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {item.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-gray-500">{item.variant}</p>
                    )}
                    <p className="text-orange-600 font-bold text-sm mt-0.5">
                      ₹{(item.price * item.qty).toFixed(0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.itemId, item.variant, -1)}
                      className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center font-bold"
                    >
                      −
                    </button>
                    <span className="font-bold min-w-[1.5rem] text-center">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.itemId, item.variant, 1)}
                      className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.itemId, item.variant)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{totalPrice.toFixed(0)}</span>
              </div>
              {deliveryCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span>₹{deliveryCharge}</span>
                </div>
              )}
              {packingCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Packing</span>
                  <span>₹{packingCharge}</span>
                </div>
              )}
              {platformFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-orange-600">
                  ₹{grandTotal.toFixed(0)}
                </span>
              </div>
              <Button
                data-ocid="cart.order.button"
                onClick={onOrder}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl text-base shadow-lg shadow-orange-200 mt-2"
              >
                Order Now 🎉
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
