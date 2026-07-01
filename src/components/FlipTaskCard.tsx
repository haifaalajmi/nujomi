"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { IconBubble } from "./IconBubble";

export function FlipTaskCard({
  name,
  icon,
  points,
  onComplete,
}: {
  name: string;
  icon: string;
  points: number;
  onComplete: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  const handleClick = () => {
    if (flipped) return;
    setFlipped(true);
    onComplete();
  };

  return (
    <button
      onClick={handleClick}
      style={{ perspective: 900 }}
      className="w-full h-[150px] bg-transparent border-0 cursor-pointer p-0"
      aria-pressed={flipped}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(.4,1.6,.6,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-[20px] border border-white/25 flex flex-col items-center justify-center gap-1.5"
          style={{ backfaceVisibility: "hidden", background: "var(--tile-color)", boxShadow: "0 4px 0 rgba(0,0,0,0.15)" }}
        >
          <IconBubble iconKey={icon} size={30} bg="rgba(255,255,255,0.22)" />
          <div className="text-white text-center px-2" style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>
            {name}
          </div>
          <div className="flex items-center gap-1 text-[13px] text-white/90 font-bold">
            <Star size={13} fill="#fff" color="#fff" /> {points}
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-[20px] border border-white/25 flex flex-col items-center justify-center gap-1.5 bg-[var(--color-meadow)]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
            <Check size={26} color="var(--color-meadow)" strokeWidth={3.5} />
          </div>
          <div className="text-white text-[15px]" style={{ fontFamily: "var(--font-display)" }}>
            Nice work!
          </div>
        </div>
      </div>
    </button>
  );
}
