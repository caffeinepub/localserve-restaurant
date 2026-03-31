import React, { useState, useEffect } from "react";

interface Props {
  openTime: string;
  closeTime: string;
  holidays: string[];
}

function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime12(date: Date) {
  let h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${ampm}`;
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type TimerStatus = "open" | "closed" | "opening-soon" | "closing-soon";

export function getTimerStatus(
  openTime: string,
  closeTime: string,
  holidays: string[],
): { status: TimerStatus; minutesLeft?: number } {
  const today = todayString();
  if (holidays.includes(today)) return { status: "closed" };

  const now = new Date();
  const nowMin = toMinutes(now);
  const openMin = parseTime(openTime);
  const closeMin = parseTime(closeTime);

  if (nowMin >= openMin && nowMin < closeMin) {
    if (closeMin - nowMin <= 30) {
      return { status: "closing-soon", minutesLeft: closeMin - nowMin };
    }
    return { status: "open" };
  }

  if (nowMin < openMin && openMin - nowMin <= 10) {
    return { status: "opening-soon", minutesLeft: openMin - nowMin };
  }

  return { status: "closed" };
}

export function LiveTimer({ openTime, closeTime, holidays }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const isDaytime = hour >= 6 && hour < 18;
  const icon = isDaytime ? "☀️" : "🌙";
  const { status, minutesLeft } = getTimerStatus(openTime, closeTime, holidays);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-4 py-3 min-w-[180px] text-center border border-gray-100">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-mono text-gray-800 font-bold text-lg leading-none mb-2">
        {formatTime12(now)}
      </div>
      {status === "open" && (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          OPEN
        </span>
      )}
      {status === "closed" && (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
          <span className="w-2 h-2 bg-red-500 rounded-full" />
          CLOSED
        </span>
      )}
      {status === "opening-soon" && (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
          🕐 Opens in {minutesLeft}min
        </span>
      )}
      {status === "closing-soon" && (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
          ⏳ Closes in {minutesLeft}min
        </span>
      )}
    </div>
  );
}
