import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

interface Props {
  images: string[];
}

export function ImageSlider({ images }: Props) {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(
    () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)),
    [images.length],
  );
  const next = useCallback(
    () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)),
    [images.length],
  );

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next, images.length]);

  if (!images.length) {
    return (
      <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: "16/7" }}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, i) => (
          <img
            key={`slide-${String(i)}`}
            src={img}
            alt={`Slide ${i + 1}`}
            className="min-w-full h-full object-cover object-center flex-shrink-0"
            style={{ filter: "none", opacity: 1 }}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-2 transition-all z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-2 transition-all z-10"
            aria-label="Next"
          >
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, i) => (
              <button
                key={`dot-${String(i)}`}
                type="button"
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? "bg-white scale-125" : "bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
