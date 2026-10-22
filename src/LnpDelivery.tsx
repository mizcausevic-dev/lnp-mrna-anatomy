import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { KineticOverlay } from "./overlay/Overlay";
import { DeliveryWorld } from "./scene/World";
import { COLORS } from "./theme";
import { cutFlash, introBlack } from "./timeline";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")";

export const LnpDelivery: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const black = introBlack(frame);
  const flash = cutFlash(frame);

  return (
    <AbsoluteFill style={{ background: COLORS.cytosol, fontFamily: "Inter, sans-serif" }}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        camera={{ fov: 32, near: 0.08, far: 220, position: [0, 2, 10] }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(COLORS.cytosol);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.22;
        }}
      >
        <DeliveryWorld />
      </ThreeCanvas>
      <KineticOverlay frame={frame} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.09,
          mixBlendMode: "overlay",
          backgroundImage: GRAIN,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "#F4F1EA",
          opacity: flash,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "#000",
          opacity: black,
        }}
      />
    </AbsoluteFill>
  );
};
