"use client";

import { useEffect, useId, useRef, useState } from "react";

export type CanvasScene = {
  width: number;
  height: number;
  durationMs: number;
  still: number;
  description: string;
  draw: (context: CanvasRenderingContext2D, progress: number) => void;
};

export default function AnimatedCanvasScene({ scene }: { scene: CanvasScene }) {
  const canvasId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toggle = useRef<(() => void) | null>(null);
  const [canPause, setCanPause] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const element = canvasRef.current;
    const renderingContext = element?.getContext("2d");
    if (!element || !renderingContext) return;

    const canvas = element;
    const context = renderingContext;

    const { width, height, durationMs, draw } = scene;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let progress = scene.still;
    let manuallyPaused = false;
    let inView = !("IntersectionObserver" in window);
    let frame: number | null = null;
    let lastTime: number | null = null;

    function paint() {
      context.clearRect(0, 0, width, height);
      draw(context, progress);
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(bounds.width * pixelRatio);
      const pixelHeight = Math.round(bounds.height * pixelRatio);
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      paint();
    }

    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    }

    function tick(now: number) {
      if (lastTime !== null) progress = (progress + (now - lastTime) / durationMs) % 1;
      lastTime = now;
      paint();
      frame = requestAnimationFrame(tick);
    }

    function syncPlayback() {
      if (!inView || document.hidden || motion.matches || manuallyPaused) {
        stop();
      } else if (frame === null) {
        frame = requestAnimationFrame(tick);
      }
    }

    function syncMotionPreference() {
      setCanPause(!motion.matches);
      syncPlayback();
    }

    toggle.current = () => {
      manuallyPaused = !manuallyPaused;
      setUserPaused(manuallyPaused);
      syncPlayback();
    };

    const intersection = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        syncPlayback();
      })
      : null;
    const size = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    size?.observe(canvas);
    intersection?.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncPlayback);
    motion.addEventListener("change", syncMotionPreference);
    setUserPaused(false);
    resize();
    syncMotionPreference();

    return () => {
      stop();
      size?.disconnect();
      intersection?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", syncPlayback);
      motion.removeEventListener("change", syncMotionPreference);
      toggle.current = null;
    };
  }, [scene]);

  const action = userPaused ? "Retomar animação" : "Pausar animação";
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        id={canvasId}
        role="img"
        aria-label={scene.description}
        width={scene.width}
        height={scene.height}
        className="block h-auto w-full"
        style={{ aspectRatio: `${scene.width} / ${scene.height}` }}
      />
      {canPause && (
        <button
          type="button"
          aria-controls={canvasId}
          aria-label={action}
          title={action}
          onClick={() => toggle.current?.()}
          className="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        />
      )}
    </div>
  );
}
