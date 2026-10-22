import * as THREE from "three";

export const COLORS = {
  cytosol: "#0B0F19",
  membrane: "#1F2A44",
  membraneDeep: "#162033",
  membraneRim: "#8EADD6",
  mint: "#00F5D4",
  mintDeep: "#0B7A6C",
  peg: "#E7FFF8",
  violet: "#9D4EDD",
  violetHot: "#E7C6FF",
  amber: "#FFB703",
  amberDeep: "#C4840A",
  amberHot: "#FFE08A",
  bone: "#F4F1EA",
  muted: "#9AA6B8",
  blood: "#6A2436",
  jig: "#D7D2C8",
} as const;

export const SHELL_R = 1.16;
export const MEMBRANE_Y = -0.55;
export const DOME = 0.0072;
export const MRNA_COUNT = 110;
export const PEG_BEADS = 5;
export const PEPTIDE_MAX = 32;

export const RIBO = new THREE.Vector3(2.62, -3.38, 0.08);

export const mixColor = (a: string, b: string, t: number) =>
  `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;

export const surfaceY = (x: number, z: number) => {
  const r2 = x * x + z * z;
  return MEMBRANE_Y - r2 * DOME;
};
