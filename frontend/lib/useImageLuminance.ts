"use client";

import { useEffect, useState } from "react";

export type LuminanceResult = "light" | "dark" | "unknown";

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function useImageLuminance(src: string | null | undefined): LuminanceResult {
  const [result, setResult] = useState<LuminanceResult>("unknown");

  useEffect(() => {
    if (!src || src.startsWith("data:")) {
      setResult("unknown");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const sampleHeight = Math.min(80, Math.floor(img.height * 0.4));
        const sampleWidth = Math.min(200, img.width);

        canvas.width = sampleWidth;
        canvas.height = sampleHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setResult("unknown");
          return;
        }

        ctx.drawImage(
          img,
          0,
          img.height - sampleHeight,
          sampleWidth,
          sampleHeight,
          0,
          0,
          sampleWidth,
          sampleHeight
        );

        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        const data = imageData.data;

        let totalLuminance = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          totalLuminance += getLuminance(data[i], data[i + 1], data[i + 2]);
        }

        const avgLuminance = totalLuminance / pixelCount;
        setResult(avgLuminance > 140 ? "light" : "dark");
      } catch {
        setResult("unknown");
      }
    };

    img.onerror = () => {
      setResult("unknown");
    };

    img.src = src;
  }, [src]);

  return result;
}

export function getTextClasses(luminance: LuminanceResult): {
  title: string;
  subtitle: string;
  muted: string;
} {
  if (luminance === "light") {
    return {
      title: "text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]",
      subtitle: "text-gray-800",
      muted: "text-gray-700",
    };
  }
  return {
    title: "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]",
    subtitle: "text-gray-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]",
    muted: "text-gray-200 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]",
  };
}
