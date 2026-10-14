import { useEffect, useRef, useState } from "react";
import type { GridSceneHandle } from "./create-grid-scene";

/**
 * Живий динамічний фон-сітка на WebGL.
 * Підключається на клієнті після гідрації. Без WebGL або при
 * `prefers-reduced-motion` відображається елегантна статична CSS-сітка без навантаження на систему.
 */
export function GridBackground({
  interactive = true,
  calm = true,
}: {
  interactive?: boolean;
  calm?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    // Check if user prefers reduced motion
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      setFallback(true);
      return;
    }

    let scene: GridSceneHandle | null = null;
    let cancelled = false;

    import("./create-grid-scene")
      .then(({ createGridScene }) => {
        if (cancelled) return;
        const compact = window.innerWidth < 1024;
        scene = createGridScene(canvas, {
          segments: compact ? 120 : 180,
          interactive,
          calm,
        });
        const rect = host.getBoundingClientRect();
        scene.resize(rect.width, rect.height);
      })
      .catch((err) => {
        console.warn("WebGL grid initialization fallback:", err);
        if (!cancelled) setFallback(true);
      });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && scene) {
        scene.resize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    observer.observe(host);

    return () => {
      cancelled = true;
      observer.disconnect();
      scene?.dispose();
    };
  }, [interactive, calm]);

  if (fallback) {
    return <div className="ideas-grid-static" aria-hidden="true" />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="ideas-grid-canvas"
      aria-hidden="true"
    />
  );
}
