"use client";

import AnimatedCanvasScene from "@/components/media/AnimatedCanvasScene";
import { trackingDockScene } from "./trackingDockScene";

export default function TrackingDockAnimation() {
  return <AnimatedCanvasScene scene={trackingDockScene} />;
}
