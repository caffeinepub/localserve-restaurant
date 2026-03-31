import { ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useCart } from "../context/CartContext";

interface Props {
  onClick: () => void;
  isOpen: boolean;
}

export function CartButton({ onClick, isOpen }: Props) {
  const { totalCount, totalPrice } = useCart();

  if (totalCount === 0 && !isOpen) return null;

  return (
    <motion.button
      data-ocid="cart.button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl font-semibold text-sm"
      style={{ boxShadow: "0 8px 32px rgba(249,115,22,0.45)" }}
    >
      <span className="relative">
        <ShoppingCart size={22} />
        <AnimatePresence>
          {totalCount > 0 && (
            <motion.span
              key={totalCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2.5 -right-2.5 bg-white text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-black"
            >
              {totalCount}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span>₹{totalPrice.toFixed(0)}</span>
    </motion.button>
  );
}
