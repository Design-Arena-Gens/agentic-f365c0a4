"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { HudOverlay } from "./HudOverlay";
import { GameScene } from "./GameScene";

export default function Game() {
  return (
    <div className="relative flex h-screen w-screen flex-col bg-neutral-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(40,70,120,0.25),_transparent_60%)]" />
      <Canvas
        shadows
        camera={{ position: [0, 2.4, 6], fov: 50 }}
        className="relative z-0 flex-1"
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
      <HudOverlay />
    </div>
  );
}
