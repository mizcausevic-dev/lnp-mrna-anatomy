import { Easing, interpolate } from "remotion";

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const easeOut = { ...CLAMP, easing: Easing.out(Easing.cubic) };
const easeInOut = { ...CLAMP, easing: Easing.inOut(Easing.cubic) };

export type Pose = {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
};

export type Act = {
  id: string;
  name: string;
  title: string;
  window: string;
  body: string;
  from: number;
  to: number;
  accent: string;
};

export const ACTS: Act[] = [
  {
    id: "01",
    name: "CIRCULATION",
    title: "LIPID NANOPARTICLE",
    window: "00:00 · 00:05",
    body: "A lipid nanoparticle in circulation. PEG-lipid chains on the shell move with thermal motion.",
    from: 0,
    to: 150,
    accent: "#00F5D4",
  },
  {
    id: "02",
    name: "SECTION",
    title: "EQUATORIAL SECTION",
    window: "00:05 · 00:10",
    body: "Equatorial section. The ionizable lipid envelope parts, and the coiled mRNA strand is visible inside.",
    from: 150,
    to: 300,
    accent: "#9D4EDD",
  },
  {
    id: "03",
    name: "ESCAPE",
    title: "ENDOSOMAL ESCAPE",
    window: "00:10 · 00:17",
    body: "The cell takes the particle up by endocytosis. In the acidic endosome, ionizable lipids protonate and the vesicle membrane opens.",
    from: 300,
    to: 510,
    accent: "#00F5D4",
  },
  {
    id: "04",
    name: "RIBOSOME",
    title: "DECODING CENTER",
    window: "00:17 · 00:25",
    body: "Released mRNA feeds the ribosomal decoding center. A nascent peptide elongates, then compacts.",
    from: 510,
    to: 750,
    accent: "#FFB703",
  },
  {
    id: "05",
    name: "DISPLAY",
    title: "SURFACE ANTIGEN",
    window: "00:25 · 00:34",
    body: "Folded antigen protein anchors across the outer host-cell membrane.",
    from: 750,
    to: 1020,
    accent: "#FFB703",
  },
];

export const actAt = (frame: number) =>
  ACTS.find((act) => frame >= act.from && frame < act.to) ?? ACTS[ACTS.length - 1];

const lerp3 = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

const orbitPose = (frame: number): Pose => {
  const t = smoothstep(Math.min(1, Math.max(0, frame / 150)));
  const ang = 0.42 + t * 1.02;
  const dist = 13.6 + (7.35 - 13.6) * t;
  const y = 3.15 + (1.42 - 3.15) * t;
  return {
    pos: [Math.sin(ang) * dist, y, Math.cos(ang) * dist],
    look: [0, 0.22, 0],
    fov: 33 + (28.5 - 33) * t,
  };
};

const keyedPose = (
  f: number,
  pos: [number, number, number],
  look: [number, number, number],
  fov: number,
) => ({ f, pos, look, fov });

export const cameraPose = (frame: number): Pose => {
  const start = orbitPose(150);
  const keys = [
    keyedPose(150, start.pos, start.look, start.fov),
    keyedPose(230, [0.28, 0.62, 12.4], [0, 0, 0], 28),
    keyedPose(300, [0.12, 0.4, 11.5], [0, 0, 0], 28),
    keyedPose(370, [3.4, 1.85, 8.2], [0, -0.25, 0], 32),
    keyedPose(420, [4.7, 0.05, 5.5], [0, -1.25, 0], 30),
    keyedPose(510, [2.9, -1.25, 4.7], [0.1, -2.25, 0.05], 30),
    keyedPose(640, [6.15, -0.7, 6.7], [2.55, -3.15, 0.2], 30),
    keyedPose(746, [5.45, -1.05, 5.85], [2.62, -3.28, 0.12], 28),
    keyedPose(766, [0.35, 2.15, 6.9], [0.15, -0.62, 0], 30),
    keyedPose(1019, [0.15, 8.4, 14.8], [0, -1.05, 0], 34),
  ];
  if (frame <= 150) return orbitPose(frame);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = smoothstep((frame - a.f) / (b.f - a.f));
      return {
        pos: lerp3(a.pos, b.pos, t),
        look: lerp3(a.look, b.look, t),
        fov: a.fov + (b.fov - a.fov) * t,
      };
    }
  }
  const last = keys[keys.length - 1];
  return { pos: last.pos, look: last.look, fov: last.fov };
};

export const shellSpin = (frame: number) => {
  const rate = 0.011;
  const settleStart = 128;
  const settleEnd = 168;
  if (frame <= settleStart) return frame * rate;
  const base = settleStart * rate;
  const span = settleEnd - settleStart;
  if (frame >= settleEnd) return base + rate * span * 0.5;
  const dt = frame - settleStart;
  return base + rate * (dt - (dt * dt) / (2 * span));
};

export const shellGap = (frame: number) => {
  if (frame < 158) return 0;
  if (frame < 214) return interpolate(frame, [158, 214], [0, 1], easeOut);
  if (frame < 300) return 1;
  return interpolate(frame, [300, 348], [1, 0], easeInOut);
};

export const shellDissolve = (frame: number) =>
  interpolate(frame, [492, 548], [0, 1], easeInOut);

export const protonation = (frame: number) =>
  interpolate(frame, [398, 468], [0, 1], easeInOut);

export const particlePosition = (frame: number): [number, number, number] => [
  0,
  interpolate(frame, [0, 320, 420, 490, 545], [0.92, 0.48, -1.05, -2.4, -2.55], easeInOut),
  0,
];

export const membraneOpacity = (frame: number) =>
  interpolate(frame, [268, 328], [0, 1], CLAMP);

export const membraneDent = (frame: number) =>
  interpolate(frame, [324, 418, 478, 540], [0, 2.45, 0.4, 0], easeInOut);

export const membraneWave = (frame: number) =>
  interpolate(frame, [300, 760, 820], [0.045, 0.04, 0.012], CLAMP);

export const jigOpacity = (frame: number) =>
  interpolate(frame, [146, 176, 286, 322], [0, 1, 1, 0], CLAMP);

export const circulationOpacity = (frame: number) =>
  interpolate(frame, [0, 18, 246, 318], [0, 1, 1, 0], CLAMP);

export const endosomeState = (frame: number) => ({
  radius: interpolate(frame, [436, 478], [0.4, 1.42], CLAMP),
  opacity: interpolate(frame, [430, 462, 520, 556], [0, 1, 0.85, 0], CLAMP),
  acid: protonation(frame),
  hole: interpolate(frame, [478, 540], [0, 1], easeInOut),
  wobble: interpolate(frame, [450, 500, 545], [0, 0.028, 0], CLAMP),
});

export const pinchState = (frame: number) => ({
  opacity: interpolate(frame, [400, 436, 478], [0, 1, 0], CLAMP),
  radius: interpolate(frame, [400, 460], [2.35, 0.42], CLAMP),
});

export const unwind = (frame: number) =>
  interpolate(frame, [505, 645], [0, 1], easeInOut);

export const translation = (frame: number) =>
  interpolate(frame, [560, 742], [0, 1], easeInOut);

export const ribosomeFade = (frame: number) =>
  interpolate(frame, [528, 572, 742, 768], [0, 1, 1, 0], CLAMP);

export const strandFade = (frame: number) =>
  interpolate(frame, [728, 768], [1, 0], CLAMP);

export const coreReveal = (frame: number) => {
  const fromSection = interpolate(shellGap(frame), [0.08, 0.42], [0, 1], CLAMP);
  const fromEscape = Math.max(shellDissolve(frame), unwind(frame));
  return Math.min(1, Math.max(fromSection, fromEscape));
};

export const cytosolOpacity = (frame: number) =>
  interpolate(frame, [340, 410, 742, 790], [0, 0.85, 0.85, 0], CLAMP);

export const matrixOpacity = (frame: number) =>
  interpolate(frame, [770, 830], [0, 1], CLAMP);

export const introBlack = (frame: number) => interpolate(frame, [0, 18], [1, 0], CLAMP);

export const cutFlash = (frame: number) =>
  interpolate(frame, [746, 754, 766], [0, 0.42, 0], CLAMP);

export const uiOpacity = (frame: number) => interpolate(frame, [10, 28], [0, 1], CLAMP);

export const phLevel = (frame: number) =>
  interpolate(frame, [360, 470], [0.18, 0.92], easeInOut);

export const phMeterOpacity = (frame: number) =>
  interpolate(frame, [336, 358, 500, 528], [0, 1, 1, 0], CLAMP);
