import * as THREE from "three";
import { MRNA_COUNT, PEPTIDE_MAX, RIBO, SHELL_R } from "./theme";
import { particlePosition, translation, unwind } from "./timeline";

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const fibonacciDirs = (count: number) => {
  const dirs: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    dirs.push(new THREE.Vector3(Math.cos(theta) * radial, y, Math.sin(theta) * radial));
  }
  return dirs;
};

export type Chain = {
  dir: THREE.Vector3;
  tangent: THREE.Vector3;
  bitangent: THREE.Vector3;
  phase: number;
  length: number;
};

const makeChains = (dirs: THREE.Vector3[], salt: number): Chain[] =>
  dirs.map((dir, i) => {
    const rnd = mulberry32(salt + i * 13);
    const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(dir, up).normalize();
    const bitangent = new THREE.Vector3().crossVectors(dir, tangent).normalize();
    return {
      dir,
      tangent,
      bitangent,
      phase: rnd() * Math.PI * 2,
      length: 0.82 + rnd() * 0.36,
    };
  });

const ALL_DIRS = fibonacciDirs(34);
export const PEG_UPPER = makeChains(
  ALL_DIRS.filter((dir) => dir.y >= 0),
  11,
);
export const PEG_LOWER = makeChains(
  ALL_DIRS.filter((dir) => dir.y < 0),
  77,
);

export const pegLocal = (chain: Chain, bead: number, frame: number) => {
  const dist = SHELL_R + 0.06 + bead * 0.15 * chain.length;
  const amp = (0.008 + bead * 0.012) * chain.length;
  const sway = Math.sin(frame * 0.1 + chain.phase + bead * 0.6) * amp;
  const sway2 = Math.cos(frame * 0.083 + chain.phase * 0.8 + bead) * amp;
  return chain.dir
    .clone()
    .multiplyScalar(dist)
    .add(chain.tangent.clone().multiplyScalar(sway))
    .add(chain.bitangent.clone().multiplyScalar(sway2));
};

export const coilLocal = (index: number) => {
  const t = index / (MRNA_COUNT - 1);
  const turns = 4.5;
  const ang = t * Math.PI * 2 * turns;
  const rad = 0.5;
  const y = (t - 0.5) * 1.28;
  return new THREE.Vector3(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
};

const COIL = Array.from({ length: MRNA_COUNT }, (_, i) => coilLocal(i));

const cubic = (
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
) => {
  const u = 1 - t;
  return p0
    .clone()
    .multiplyScalar(u * u * u)
    .add(p1.clone().multiplyScalar(3 * u * u * t))
    .add(p2.clone().multiplyScalar(3 * u * t * t))
    .add(p3.clone().multiplyScalar(t * t * t));
};

export const entryPoint = () => RIBO.clone().add(new THREE.Vector3(-0.62, 0.28, 0.42));
export const exitPoint = () => RIBO.clone().add(new THREE.Vector3(0.78, 0.12, -0.18));

export const pathPoint = (t: number, particle: THREE.Vector3) => {
  const p0 = particle.clone();
  const p1 = particle.clone().add(new THREE.Vector3(0.85, -0.35, 0.45));
  const p2 = entryPoint().add(new THREE.Vector3(-0.35, 0.18, 0.12));
  const p3 = exitPoint();
  return cubic(p0, p1, p2, p3, Math.min(1, Math.max(0, t)));
};

export const strandPositions = (frame: number) => {
  const particle = new THREE.Vector3(...particlePosition(frame));
  const released = unwind(frame) * (MRNA_COUNT - 1);
  const slide = translation(frame) * 0.16;
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < MRNA_COUNT; i++) {
    if (i <= released) {
      const pathT = Math.min(1, (released - i) / (MRNA_COUNT - 1) + slide);
      positions.push(pathPoint(pathT, particle));
    } else {
      positions.push(COIL[i].clone().add(particle));
    }
  }
  return positions;
};

export const readHeadPosition = (frame: number) => {
  const particle = new THREE.Vector3(...particlePosition(frame));
  const t = Math.min(0.6 + translation(frame) * 0.28, Math.max(0.12, unwind(frame)));
  return pathPoint(t, particle);
};

const peptideExit = () => RIBO.clone().add(new THREE.Vector3(0.98, -0.08, 0.12));
const peptideDir = () => new THREE.Vector3(1, 0.08, 0.22).normalize();

export const peptidePositions = (frame: number) => {
  const progress = translation(frame);
  const count = progress * PEPTIDE_MAX;
  const exit = peptideExit();
  const dir = peptideDir();
  const foldCenter = exit.clone().add(new THREE.Vector3(1.05, 0.12, 0.18));
  const foldMix = Math.min(1, Math.max(0, (progress - 0.34) / 0.55));
  const points: { pos: THREE.Vector3; visible: boolean; newest: boolean }[] = [];
  for (let i = 0; i < PEPTIDE_MAX; i++) {
    if (i >= count) {
      points.push({ pos: exit, visible: false, newest: false });
      continue;
    }
    const dist = (count - 1 - i) * 0.072;
    const along = exit.clone().add(dir.clone().multiplyScalar(dist));
    const ang = i * 2.399963;
    const shell = 0.06 + (i % 6) * 0.03;
    const folded = foldCenter
      .clone()
      .add(new THREE.Vector3(Math.cos(ang) * shell, ((i % 4) - 1.5) * 0.055, Math.sin(ang) * shell));
    const age = count - i;
    const localFold = foldMix * Math.min(1, age / 9);
    points.push({
      pos: along.lerp(folded, localFold),
      visible: true,
      newest: i > count - 1.6,
    });
  }
  return points;
};

const scatter = (count: number, salt: number, minR: number, maxR: number, minGap: number) => {
  const pts: { x: number; z: number; scale: number; yaw: number }[] = [];
  let guard = 0;
  while (pts.length < count && guard < 4000) {
    guard += 1;
    const rnd = mulberry32(salt + guard * 17);
    const ang = rnd() * Math.PI * 2;
    const rad = minR + rnd() * (maxR - minR);
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    if (pts.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < minGap * minGap)) continue;
    pts.push({ x, z, scale: 0.84 + rnd() * 0.32, yaw: rnd() * Math.PI * 2 });
  }
  return pts;
};

export const ANTIGENS = scatter(24, 400, 1.2, 7.4, 1.2)
  .filter((item) => item.z < 2.6)
  .slice(0, 16)
  .map((item) => {
    const rad = Math.hypot(item.x, item.z);
    return { ...item, delay: 776 + Math.round(rad * 20) };
  });

export const RED_CELLS = Array.from({ length: 6 }, (_, i) => {
  const rnd = mulberry32(900 + i * 29);
  const ang = rnd() * Math.PI * 2;
  const dist = 16 + rnd() * 6;
  return {
    position: [Math.cos(ang) * dist, 1.2 + rnd() * 4.5, Math.sin(ang) * dist] as [number, number, number],
    scale: [1.5 + rnd() * 1.1, 0.22 + rnd() * 0.08, 1.4 + rnd() * 0.8] as [number, number, number],
    rot: rnd() * Math.PI,
    drift: rnd() * Math.PI * 2,
  };
});

export const PLASMA = Array.from({ length: 28 }, (_, i) => {
  const rnd = mulberry32(1200 + i * 19);
  const ang = rnd() * Math.PI * 2;
  const dist = 2.6 + rnd() * 5.5;
  return {
    position: new THREE.Vector3(Math.cos(ang) * dist, -1.2 + rnd() * 3.4, Math.sin(ang) * dist),
    radius: 0.025 + rnd() * 0.04,
    phase: rnd() * Math.PI * 2,
  };
});

export const CYTOSOL = Array.from({ length: 54 }, (_, i) => {
  const rnd = mulberry32(1500 + i * 23);
  return {
    position: new THREE.Vector3(-7 + rnd() * 14, -6.2 + rnd() * 4.2, -6 + rnd() * 12),
    radius: 0.03 + rnd() * 0.05,
    phase: rnd() * Math.PI * 2,
  };
});

export const PROTONS = Array.from({ length: 16 }, (_, i) => {
  const rnd = mulberry32(1800 + i * 31);
  const theta = rnd() * Math.PI * 2;
  const u = rnd() * 2 - 1;
  const r = Math.sqrt(Math.max(0, 1 - u * u));
  return {
    dir: new THREE.Vector3(Math.cos(theta) * r, u, Math.sin(theta) * r),
    phase: rnd() * Math.PI * 2,
  };
});

export const SHARDS = Array.from({ length: 8 }, (_, i) => {
  const rnd = mulberry32(2100 + i * 41);
  const ang = (i / 8) * Math.PI * 2 + rnd() * 0.4;
  return {
    yaw: ang,
    lift: (rnd() - 0.5) * 0.6,
    spin: rnd() * Math.PI,
    tint: rnd(),
  };
});

export const FIBERS = Array.from({ length: 7 }, (_, i) => {
  const rnd = mulberry32(2400 + i * 37);
  const pts: THREE.Vector3[] = [];
  const y = 0.7 + rnd() * 1.8;
  const z0 = -8 + i * 2.1;
  for (let k = 0; k < 6; k++) {
    pts.push(new THREE.Vector3(-9 + k * 3.4, y + Math.sin(k + i) * 0.35, z0 + (rnd() - 0.5) * 1.4));
  }
  return pts;
});
