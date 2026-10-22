import React from "react";
import { Easing, interpolate } from "remotion";
import { ACTS, actAt, phLevel, phMeterOpacity, uiOpacity } from "../timeline";

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const pad = (value: number) => value.toString().padStart(2, "0");

const timecode = (frame: number) => {
  const frames = frame % 30;
  const totalSeconds = Math.floor(frame / 30);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
};

const rise = (frame: number, enter: number) => {
  const local = frame - enter;
  return {
    opacity: interpolate(local, [0, 12], [0, 1], CLAMP),
    y: interpolate(local, [0, 14], [18, 0], { ...CLAMP, easing: Easing.out(Easing.cubic) }),
  };
};

const SWATCHES = [
  { color: "#00F5D4", label: "Ionizable lipid" },
  { color: "#9D4EDD", label: "mRNA" },
  { color: "#FFB703", label: "Ribosome / antigen" },
];

export const KineticOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const act = actAt(frame);
  const ui = uiOpacity(frame);
  const title = rise(frame, act.from + 6);
  const meter = phMeterOpacity(frame);
  const level = phLevel(frame);
  const endBlend = interpolate(frame, [928, 968], [0, 1], CLAMP);
  const body = endBlend > 0.5 ? "Schematic path from circulation to a membrane-anchored antigen." : act.body;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: ui,
        pointerEvents: "none",
        fontFamily: "Inter, Liberation Sans, sans-serif",
        color: "#F4F1EA",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          top: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ minWidth: 220 }}>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              letterSpacing: "0.34em",
              color: "#9AA6B8",
            }}
          >
            ANATOMY
          </div>
          <div style={{ marginTop: 4, fontSize: 14, letterSpacing: "0.08em", fontWeight: 600 }}>mRNA DELIVERY</div>
          <div
            style={{
              marginTop: 6,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "rgba(154,166,184,0.9)",
            }}
          >
            SCHEMATIC · NOT TO SCALE
          </div>
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          {ACTS.map((item) => {
            const active = item.id === act.id;
            return (
              <div key={item.id} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    color: active ? item.accent : "rgba(244,241,234,0.38)",
                  }}
                >
                  {item.id}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    color: active ? "#F4F1EA" : "rgba(244,241,234,0.38)",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    height: 2,
                    width: active ? 56 : 0,
                    marginLeft: "auto",
                    marginRight: "auto",
                    background: item.accent,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ minWidth: 220, textAlign: "right" }}>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              letterSpacing: "0.22em",
              color: "#9AA6B8",
            }}
          >
            TC
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            {timecode(frame)}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 64,
          top: "46%",
          opacity: meter,
          transform: "translateY(-50%)",
        }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            letterSpacing: "0.22em",
            color: "#00F5D4",
          }}
        >
          pH
        </div>
        <div style={{ marginTop: 8, fontSize: 11, letterSpacing: "0.16em", color: "#9AA6B8" }}>NEUTRAL</div>
        <div
          style={{
            marginTop: 8,
            width: 10,
            height: 132,
            borderRadius: 99,
            background: "rgba(244,241,234,0.12)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${Math.round(level * 100)}%`,
              background: "#00F5D4",
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, letterSpacing: "0.16em", color: "#00F5D4" }}>ACIDIC</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 34,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        <div style={{ maxWidth: 760, transform: `translateY(${title.y}px)`, opacity: title.opacity }}>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              letterSpacing: "0.22em",
              color: act.accent,
            }}
          >
            {act.id}  /  {act.window}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 52,
              lineHeight: 0.92,
              fontWeight: 700,
              letterSpacing: "-0.035em",
            }}
          >
            {act.title}
          </div>
          <div
            style={{
              marginTop: 12,
              maxWidth: 620,
              fontSize: 18,
              lineHeight: 1.35,
              color: "#C9D0DA",
              fontWeight: 400,
            }}
          >
            {body}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {SWATCHES.map((swatch) => (
            <div key={swatch.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 13, letterSpacing: "0.08em", color: "#C9D0DA" }}>{swatch.label}</div>
              <div style={{ width: 14, height: 14, borderRadius: 99, background: swatch.color }} />
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          bottom: 18,
          display: "flex",
          gap: 6,
        }}
      >
        {ACTS.map((item) => {
          const span = item.to - item.from;
          const local = Math.min(1, Math.max(0, (frame - item.from) / span));
          return (
            <div
              key={item.id}
              style={{
                flex: span,
                height: 3,
                borderRadius: 99,
                background: "rgba(244,241,234,0.12)",
                overflow: "hidden",
              }}
            >
              <div style={{ width: `${local * 100}%`, height: "100%", background: item.accent }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
