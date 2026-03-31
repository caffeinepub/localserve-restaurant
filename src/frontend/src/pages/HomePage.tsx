import {
  ChevronRight,
  Clock,
  MapPin,
  Search,
  Star,
  Utensils,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getTimerStatus } from "../components/LiveTimer";
import { useRestaurants } from "../hooks/useFirebase";
import type { Restaurant } from "../types";

function useTypewriter(
  texts: string[],
  typeSpeed = 80,
  eraseSpeed = 50,
  pauseMs = 1800,
) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const idx = useRef(0);
  const charIdx = useRef(0);
  const erasing = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional stable ref pattern
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = texts[idx.current % texts.length];
      if (!erasing.current) {
        if (charIdx.current < current.length) {
          charIdx.current++;
          setDisplayed(current.slice(0, charIdx.current));
          timeout = setTimeout(tick, typeSpeed);
        } else {
          timeout = setTimeout(() => {
            erasing.current = true;
            tick();
          }, pauseMs);
        }
      } else {
        if (charIdx.current > 0) {
          charIdx.current--;
          setDisplayed(current.slice(0, charIdx.current));
          timeout = setTimeout(tick, eraseSpeed);
        } else {
          erasing.current = false;
          idx.current++;
          timeout = setTimeout(tick, 300);
        }
      }
    };
    timeout = setTimeout(tick, typeSpeed);
    const cursorInterval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => {
      clearTimeout(timeout);
      clearInterval(cursorInterval);
    };
  }, []);

  return { displayed, showCursor };
}

function TypewriterHeading() {
  const { displayed, showCursor } = useTypewriter(
    [
      "Top Restaurant Near You",
      "Best Food Near You",
      "Top Restaurant Near You",
    ],
    85,
    45,
    2000,
  );
  return (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
      <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
        {displayed}
      </span>
      <span
        className={`inline-block w-[3px] h-[0.85em] ml-1 align-middle bg-orange-400 rounded ${showCursor ? "opacity-100" : "opacity-0"}`}
      />
    </h1>
  );
}

function RestaurantCard({
  r,
  onClick,
}: { r: Restaurant; onClick: () => void }) {
  const { status } = getTimerStatus(r.openTime, r.closeTime, r.holidays || []);
  const isOpen = status === "open" || status === "closing-soon";

  return (
    <motion.div
      data-ocid="restaurant.card"
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer group bg-[#1B2228] rounded-2xl overflow-hidden border border-[#2A333A] hover:border-orange-500/40 transition-all shadow-lg hover:shadow-orange-900/20 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        {r.coverImage ? (
          <img
            src={r.coverImage}
            alt={r.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-900/30 to-gray-800 flex items-center justify-center">
            <Utensils size={48} className="text-orange-400/50" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Star size={10} fill="currentColor" className="text-yellow-400" /> 4.5
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-bold text-lg leading-tight">{r.name}</h3>
        <p className="text-[#A9B3BC] text-sm mt-1 line-clamp-2">
          {r.description || "Delicious food, great experience"}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-[#A9B3BC] text-xs">
            <Clock size={12} /> {r.openTime} – {r.closeTime}
          </span>
          {r.homeDeliveryAvailable && (
            <span className="text-green-400 text-xs font-medium">
              • Delivery
            </span>
          )}
        </div>
        <button
          type="button"
          className="mt-3 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-1.5 hover:from-orange-600 hover:to-orange-700 transition-all"
        >
          Order Now <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export function HomePage() {
  const { restaurants, loading } = useRestaurants();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = restaurants.filter(
    (r) => r.isActive && r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#0F1418] text-[#F2F4F6]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#0F1418]/95 backdrop-blur-md border-b border-[#2A333A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Utensils size={16} className="text-white" />
            </div>
            <span className="text-xl font-black text-white">
              Local<span className="text-orange-500">Serve</span>
            </span>
          </div>
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A9B3BC]"
              />
              <input
                data-ocid="nav.search_input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants..."
                className="w-full bg-[#1B2228] border border-[#2A333A] text-white placeholder-[#A9B3BC] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-orange-500/60"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-ocid="nav.track.link"
              onClick={() => navigate("/track")}
              className="hidden sm:flex items-center gap-1.5 text-[#A9B3BC] hover:text-white text-sm transition-colors"
            >
              <MapPin size={15} /> Track Order
            </button>
          </div>
        </div>
        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A9B3BC]"
            />
            <input
              data-ocid="nav.search_input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full bg-[#1B2228] border border-[#2A333A] text-white placeholder-[#A9B3BC] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-orange-500/60"
            />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/20 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              🍽️ Top Trusted Restaurants Near You
            </span>
            <TypewriterHeading />
            <p className="text-[#A9B3BC] text-lg max-w-xl mx-auto mb-8">
              Order from the best local restaurants, track in real-time,
              delivered fresh to your door.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Restaurant Grid */}
      <section
        id="restaurants"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Restaurants</h2>
          <span className="text-[#A9B3BC] text-sm">
            {filtered.length} available
          </span>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={String(i)}
                className="w-full max-w-sm bg-[#1B2228] rounded-2xl overflow-hidden border border-[#2A333A] animate-pulse"
              >
                <div className="h-48 bg-[#2A333A]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#2A333A] rounded w-3/4" />
                  <div className="h-3 bg-[#2A333A] rounded w-full" />
                  <div className="h-9 bg-[#2A333A] rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div data-ocid="restaurant.empty_state" className="text-center py-20">
            <Utensils size={48} className="mx-auto text-[#2A333A] mb-4" />
            <p className="text-[#A9B3BC]">No restaurants found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filtered.map((r, idx) => (
              <div
                key={r.id}
                className="w-full max-w-sm"
                data-ocid={`restaurant.item.${idx + 1}`}
              >
                <RestaurantCard
                  r={r}
                  onClick={() => navigate(`/restaurant/${r.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A333A] py-8 text-center text-[#A9B3BC] text-sm">
        <p>&copy; 2026 Made with ❤️ India</p>
      </footer>
    </div>
  );
}
