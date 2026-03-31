import React from "react";

interface Props {
  text: string;
}

export function AnnouncementTicker({ text }: Props) {
  if (!text) return null;
  return (
    <div className="announcement-ticker bg-amber-500 text-black py-2 px-4 overflow-hidden whitespace-nowrap relative">
      <div className="ticker-content inline-block animate-ticker hover:[animation-play-state:paused] text-sm font-semibold">
        📢 {text} &nbsp;&nbsp;&nbsp;📢 {text} &nbsp;&nbsp;&nbsp;📢 {text}
      </div>
    </div>
  );
}
