import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { RestaurantPage } from "./pages/RestaurantPage";
import { TrackOrderPage } from "./pages/TrackOrderPage";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurant/:id" element={<RestaurantPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </CartProvider>
    </BrowserRouter>
  );
}
