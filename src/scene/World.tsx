import { useFrame, useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import {
  ANTIGENS,
  CYTOSOL,
  FIBERS,
  PEG_LOWER,
  PEG_UPPER,
  PLASMA,
  PROTONS,
  RED_CELLS,
  SHARDS,
  pegLocal,
  peptidePositions,
  readHeadPosition,
  strandPositions,
  type Chain,
} from "../sim";
import { ENDOSOME_FRAG, ENDOSOME_VERT, MEMBRANE_FRAG, MEMBRANE_VERT } from "../shaders";
import {
  COLORS,
  DOME,
  MEMBRANE_Y,
  MRNA_COUNT,
  PEG_BEADS,
  PEPTIDE_MAX,
  RIBO,
  SHELL_R,
  mixColor,
  surfaceY,
} from "../theme";
import {
  cameraPose,
  circulationOpacity,
  coreReveal,
  cytosolOpacity,
  endosomeState,
  jigOpacity,
  matrixOpacity,
  membraneDent,
  membraneOpacity,
  membraneWave,
  particlePosition,
  pinchState,
  protonation,
  ribosomeFade,
  shellDissolve,
  shellGap,
  shellSpin,
  strandFade,
  unwind,
} from "../timeline";

const applyCamera = (camera: THREE.PerspectiveCamera, frame: number) => {
  const pose = cameraPose(frame);
  camera.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
  camera.fov = pose.fov;
  camera.near = 0.08;
  camera.far = 220;
  camera.lookAt(pose.look[0], pose.look[1], pose.look[2]);
  camera.updateProjectionMatrix();
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useLayoutEffect(() => {
    applyCamera(camera, frame);
  }, [camera, frame]);
  useFrame(() => {
    applyCamera(camera, frameRef.current);
  });
  return null;
};

const Lights: React.FC = () => {
  const frame = useCurrentFrame();
  const particle = particlePosition(frame);
  const acid = protonation(frame) * (1 - shellDissolve(frame));
  const ribo = ribosomeFade(frame);
  const gap = shellGap(frame);
  return (
    <>
      <hemisphereLight args={["#2A3E62", "#07090E", 0.72]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[8, 11, 6]} intensity={3.1} color={"#F7F8FF"} />
      <directionalLight position={[-7, 3, -5]} intensity={1.15} color={"#7EF3E4"} />
      <pointLight position={[-6.5, 3.2, -4]} intensity={22} distance={24} decay={2} color={COLORS.mint} />
      <pointLight
        position={[particle[0], particle[1], particle[2]]}
        intensity={acid * 36}
        distance={7.5}
        decay={2}
        color={"#8FFFEA"}
      />
      <pointLight position={[2.3, -2.4, 2.1]} intensity={ribo * 42} distance={10} decay={2} color={COLORS.amber} />
      <pointLight position={[0, 0.2, 0.4]} intensity={gap * 10} distance={5.5} decay={2} color={COLORS.violet} />
    </>
  );
};

const Circulation: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = circulationOpacity(frame);
  const plasmaRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useFrame(() => {
    const mesh = plasmaRef.current;
    if (!mesh) return;
    const f = frameRef.current;
    const alpha = circulationOpacity(f);
    PLASMA.forEach((mote, index) => {
      dummy.position.set(
        mote.position.x + Math.sin(f * 0.02 + mote.phase) * 0.18,
        mote.position.y + Math.cos(f * 0.017 + mote.phase) * 0.12,
        mote.position.z,
      );
      dummy.scale.setScalar(alpha > 0.01 ? mote.radius : 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  if (fade <= 0.01) return null;
  return (
    <group>
      {RED_CELLS.map((cell, index) => {
        const drift = Math.sin(frame * 0.015 + cell.drift) * 0.4;
        return (
          <mesh
            key={index}
            position={[cell.position[0] + drift, cell.position[1], cell.position[2]]}
            rotation={[0.4, cell.rot + frame * 0.002, 0.2]}
            scale={cell.scale}
          >
            <sphereGeometry args={[1, 20, 12]} />
            <meshStandardMaterial
              color={COLORS.blood}
              transparent
              opacity={0.22 * fade}
              roughness={0.7}
              depthWrite={false}
            />
          </mesh>
        );
      })}
      <instancedMesh ref={plasmaRef} args={[undefined, undefined, PLASMA.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={"#9BB0CC"} transparent opacity={0.45 * fade} depthWrite={false} />
      </instancedMesh>
    </group>
  );
};

const Jig: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = jigOpacity(frame);
  if (fade <= 0.01) return null;
  const posts: [number, number, number][] = [
    [2.38, 0, 0],
    [-2.38, 0, 0],
    [0, 0, 2.38],
    [0, 0, -2.38],
  ];
  return (
    <group>
      {posts.map((position, index) => (
        <mesh key={index} position={position}>
          <cylinderGeometry args={[0.018, 0.018, 3.15, 8]} />
          <meshStandardMaterial color={COLORS.jig} metalness={0.62} roughness={0.32} transparent opacity={0.72 * fade} />
        </mesh>
      ))}
      {[1.12, -1.12].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.38, 0.014, 8, 64]} />
          <meshStandardMaterial color={COLORS.jig} metalness={0.55} roughness={0.34} transparent opacity={0.8 * fade} />
        </mesh>
      ))}
    </group>
  );
};

const PegField: React.FC<{ chains: Chain[] }> = ({ chains }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const frame = useCurrentFrame();
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const f = frameRef.current;
    const dissolve = shellDissolve(f);
    let index = 0;
    chains.forEach((chain) => {
      for (let bead = 0; bead < PEG_BEADS; bead++) {
        dummy.position.copy(pegLocal(chain, bead, f));
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar((0.05 - bead * 0.006) * (dissolve > 0.98 ? 0 : 1));
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.opacity = 1 - dissolve;
    material.transparent = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, chains.length * PEG_BEADS]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color={COLORS.peg} emissive={COLORS.mint} emissiveIntensity={0.42} roughness={0.3} />
    </instancedMesh>
  );
};

const Hemisphere: React.FC<{ sign: 1 | -1 }> = ({ sign }) => {
  const frame = useCurrentFrame();
  const gap = shellGap(frame);
  const dissolve = shellDissolve(frame);
  const proton = protonation(frame);
  const y = sign * (gap * 0.74 + dissolve * 0.28);
  const opacity = (0.9 - gap * 0.34) * (1 - dissolve);
  const color = mixColor(COLORS.mintDeep, COLORS.mint, 0.45 + proton * 0.55);
  const showCut = gap > 0.06 && dissolve < 0.85;
  return (
    <group position={[0, y, 0]} scale={1 + dissolve * 0.05}>
      <mesh>
        <sphereGeometry args={[SHELL_R, 56, 28, 0, Math.PI * 2, sign === 1 ? 0 : Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          emissive={COLORS.mint}
          emissiveIntensity={0.1 + proton * 0.38}
          roughness={0.2}
          metalness={0.06}
          transparent
          opacity={Math.max(0, opacity)}
          side={THREE.DoubleSide}
          depthWrite={opacity > 0.35}
        />
      </mesh>
      {showCut ? (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, sign * -0.004, 0]}>
            <circleGeometry args={[SHELL_R - 0.02, 48]} />
            <meshStandardMaterial color={"#071612"} roughness={0.72} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[SHELL_R - 0.01, 0.02, 8, 56]} />
            <meshBasicMaterial color={COLORS.mint} toneMapped={false} />
          </mesh>
        </group>
      ) : null}
      <PegField chains={sign === 1 ? PEG_UPPER : PEG_LOWER} />
    </group>
  );
};

const ClosedShell: React.FC = () => {
  const frame = useCurrentFrame();
  const proton = protonation(frame);
  const color = mixColor(COLORS.mintDeep, COLORS.mint, 0.35 + proton * 0.65);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[SHELL_R, 64, 40]} />
        <meshStandardMaterial
          color={color}
          emissive={COLORS.mint}
          emissiveIntensity={0.1 + proton * 0.38}
          roughness={0.2}
          metalness={0.06}
        />
      </mesh>
      <PegField chains={PEG_UPPER} />
      <PegField chains={PEG_LOWER} />
    </group>
  );
};

const Nanoparticle: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = shellSpin(frame);
  const particle = particlePosition(frame);
  const gap = shellGap(frame);
  const dissolve = shellDissolve(frame);
  if (dissolve > 0.995) return null;
  const split = gap > 0.02 || dissolve > 0.02;
  return (
    <group position={particle} rotation={[0, spin, 0]}>
      {split ? (
        <>
          <Hemisphere sign={1} />
          <Hemisphere sign={-1} />
        </>
      ) : (
        <ClosedShell />
      )}
    </group>
  );
};

const Leaflet: React.FC<{ y: number; opacityScale: number; color: string }> = ({ y, opacityScale, color }) => {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const frame = useCurrentFrame();
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDent: { value: 0 },
      uDome: { value: DOME },
      uWave: { value: 0.02 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uRim: { value: new THREE.Color(COLORS.membraneRim) },
      uCam: { value: new THREE.Vector3() },
    }),
    [color],
  );
  useFrame(({ camera }) => {
    const material = ref.current;
    if (!material) return;
    const f = frameRef.current;
    material.uniforms.uTime.value = f;
    material.uniforms.uDent.value = membraneDent(f);
    material.uniforms.uWave.value = membraneWave(f);
    material.uniforms.uOpacity.value = membraneOpacity(f) * opacityScale;
    material.uniforms.uCam.value.copy(camera.position);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[42, 42, 72, 72]} />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        vertexShader={MEMBRANE_VERT}
        fragmentShader={MEMBRANE_FRAG}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const Membrane: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = membraneOpacity(frame);
  const pinch = pinchState(frame);
  if (fade <= 0.01 && pinch.opacity <= 0.01) return null;
  return (
    <group>
      <group position={[0, MEMBRANE_Y, 0]}>
        <Leaflet y={0.045} opacityScale={0.72} color={COLORS.membrane} />
        <Leaflet y={-0.045} opacityScale={0.5} color={COLORS.membraneDeep} />
      </group>
      {pinch.opacity > 0.01 ? (
        <mesh position={[0, MEMBRANE_Y - 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[pinch.radius, 0.045, 8, 40]} />
          <meshBasicMaterial color={COLORS.membraneRim} transparent opacity={0.55 * pinch.opacity} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
};

const Endosome: React.FC = () => {
  const frame = useCurrentFrame();
  const state = endosomeState(frame);
  const particle = particlePosition(frame);
  const outer = useRef<THREE.ShaderMaterial>(null);
  const inner = useRef<THREE.ShaderMaterial>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const holeDir = useMemo(() => new THREE.Vector3(), []);
  const makeUniforms = () => ({
    uTime: { value: 0 },
    uWobble: { value: 0 },
    uHole: { value: 0 },
    uAcid: { value: 0 },
    uOpacity: { value: 0 },
    uHoleDir: { value: new THREE.Vector3(1, -0.2, 0) },
    uCam: { value: new THREE.Vector3() },
  });
  const outerUniforms = useMemo(makeUniforms, []);
  const innerUniforms = useMemo(makeUniforms, []);
  useFrame(({ camera }) => {
    const f = frameRef.current;
    const live = endosomeState(f);
    const origin = new THREE.Vector3(...particlePosition(f));
    holeDir.copy(RIBO).sub(origin).normalize();
    [outer.current, inner.current].forEach((material, index) => {
      if (!material) return;
      material.uniforms.uTime.value = f;
      material.uniforms.uWobble.value = live.wobble;
      material.uniforms.uHole.value = live.hole;
      material.uniforms.uAcid.value = live.acid;
      material.uniforms.uOpacity.value = live.opacity * (index === 0 ? 0.85 : 0.28);
      material.uniforms.uHoleDir.value.copy(holeDir);
      material.uniforms.uCam.value.copy(camera.position);
    });
  });
  const protonRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const mesh = protonRef.current;
    if (!mesh) return;
    const f = frameRef.current;
    const live = endosomeState(f);
    const proton = protonation(f);
    const origin = new THREE.Vector3(...particlePosition(f));
    const dissolve = shellDissolve(f);
    PROTONS.forEach((item, index) => {
      const shellPoint = item.dir.clone().multiplyScalar(SHELL_R * 0.92).add(origin);
      const freePoint = item.dir
        .clone()
        .multiplyScalar(live.radius * 0.78)
        .add(origin)
        .add(new THREE.Vector3(Math.sin(f * 0.08 + item.phase) * 0.08, 0, Math.cos(f * 0.07 + item.phase) * 0.08));
      dummy.position.copy(freePoint.lerp(shellPoint, proton));
      const visible = live.opacity > 0.15 && dissolve < 0.9;
      dummy.scale.setScalar(visible ? 0.07 : 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  if (state.opacity <= 0.01) return null;
  const origin = new THREE.Vector3(...particle);
  const toRibo = RIBO.clone().sub(origin);
  if (toRibo.lengthSq() < 1e-8) toRibo.set(1, 0, 0);
  toRibo.normalize();
  return (
    <group position={particle}>
      <mesh scale={state.radius}>
        <sphereGeometry args={[1, 64, 40]} />
        <shaderMaterial
          ref={outer}
          uniforms={outerUniforms}
          vertexShader={ENDOSOME_VERT}
          fragmentShader={ENDOSOME_FRAG}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh scale={state.radius * 0.9}>
        <sphereGeometry args={[1, 32, 22]} />
        <shaderMaterial
          ref={inner}
          uniforms={innerUniforms}
          vertexShader={ENDOSOME_VERT}
          fragmentShader={ENDOSOME_FRAG}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      <instancedMesh ref={protonRef} args={[undefined, undefined, PROTONS.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={COLORS.mint} toneMapped={false} />
      </instancedMesh>
      {SHARDS.slice(0, 5).map((shard, index) => {
        const dir = new THREE.Vector3(Math.cos(shard.yaw) * 0.35, shard.lift * 0.25, Math.sin(shard.yaw) * 0.35);
        const outward = toRibo.clone().add(dir).normalize();
        const distance = state.radius * 0.98 + state.hole * (0.55 + index * 0.12);
        return (
          <mesh
            key={index}
            position={outward.multiplyScalar(distance).toArray()}
            rotation={[shard.spin, shard.yaw, state.hole]}
            scale={state.hole > 0.35 ? state.hole : 0.0001}
          >
            <planeGeometry args={[0.34, 0.18]} />
            <meshBasicMaterial
              color={shard.tint > 0.5 ? COLORS.membraneRim : COLORS.membrane}
              transparent
              opacity={state.opacity * (1 - state.hole * 0.65) * 0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const Mrna: React.FC = () => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const frame = useCurrentFrame();
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const painted = useRef(false);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const f = frameRef.current;
    const reveal = coreReveal(f) * strandFade(f);
    const points = strandPositions(f);
    if (!painted.current) {
      const violet = new THREE.Color(COLORS.violet);
      const hot = new THREE.Color(COLORS.violetHot);
      for (let i = 0; i < MRNA_COUNT; i++) mesh.setColorAt(i, i % 6 === 0 ? hot : violet);
      const colors = mesh.instanceColor;
      if (colors) colors.needsUpdate = true;
      painted.current = true;
    }
    points.forEach((point, index) => {
      dummy.position.copy(point);
      dummy.rotation.set(0, 0, 0);
      const tailFade = unwind(f) > 0.2 && index / MRNA_COUNT > 0.92 ? 0.65 : 1;
      dummy.scale.setScalar(reveal * 0.05 * tailFade);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  const head = readHeadPosition(frame);
  const showHead = unwind(frame) > 0.42 && strandFade(frame) > 0.05;
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, MRNA_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={COLORS.violet} toneMapped={false} />
      </instancedMesh>
      <mesh position={head} scale={showHead ? 0.16 : 0.0001}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color={COLORS.amberHot} toneMapped={false} />
      </mesh>
      <mesh position={head} scale={showHead ? 0.32 : 0.0001}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={COLORS.violet} transparent opacity={0.28} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

const Peptide: React.FC = () => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const frame = useCurrentFrame();
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const beads = peptidePositions(frameRef.current);
    const fade = ribosomeFade(frameRef.current);
    beads.forEach((bead, index) => {
      dummy.position.copy(bead.pos);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(bead.visible ? (bead.newest ? 0.085 : 0.064) * fade : 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PEPTIDE_MAX]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={COLORS.amber} toneMapped={false} />
    </instancedMesh>
  );
};

const Ribosome: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = ribosomeFade(frame);
  if (fade <= 0.01) return <Peptide />;
  const gloss = {
    roughness: 0.38,
    metalness: 0.05,
    transparent: fade < 0.99,
    opacity: fade,
  };
  return (
    <group>
      <group position={RIBO.toArray()}>
        <mesh position={[0.14, -0.06, 0]} scale={[1.24, 0.98, 1.08]}>
          <sphereGeometry args={[0.8, 36, 28]} />
          <meshStandardMaterial
            color={COLORS.amber}
            emissive={COLORS.amber}
            emissiveIntensity={0.72}
            toneMapped={false}
            {...gloss}
          />
        </mesh>
        <mesh position={[-0.32, 0.44, 0.14]} scale={[0.88, 0.58, 0.8]}>
          <sphereGeometry args={[0.64, 32, 24]} />
          <meshStandardMaterial
            color={COLORS.amberDeep}
            emissive={COLORS.amber}
            emissiveIntensity={0.55}
            toneMapped={false}
            roughness={0.46}
            metalness={0.04}
            transparent={fade < 0.99}
            opacity={fade}
          />
        </mesh>
        <mesh position={[-0.02, 0.18, 0.5]} rotation={[1.15, 0.25, 0.2]}>
          <torusGeometry args={[0.18, 0.02, 8, 28]} />
          <meshBasicMaterial color={COLORS.amberHot} transparent opacity={fade} toneMapped={false} />
        </mesh>
      </group>
      <Peptide />
    </group>
  );
};

const CytosolMotes: React.FC = () => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const frame = useCurrentFrame();
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const f = frameRef.current;
    const fade = cytosolOpacity(f);
    CYTOSOL.forEach((mote, index) => {
      dummy.position.set(mote.position.x, mote.position.y + Math.sin(f * 0.02 + mote.phase) * 0.08, mote.position.z);
      dummy.scale.setScalar(fade > 0.02 ? mote.radius : 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, CYTOSOL.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={"#31425F"} transparent opacity={0.7} />
    </instancedMesh>
  );
};

const Antigen: React.FC<{ spec: (typeof ANTIGENS)[number] }> = ({ spec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const popped = spring({
    frame: Math.max(0, frame - spec.delay),
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.65 },
  });
  if (frame < spec.delay) return null;
  const y = surfaceY(spec.x, spec.z);
  return (
    <group position={[spec.x, y, spec.z]} rotation={[0, spec.yaw, 0]} scale={popped * spec.scale}>
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.2, 8]} />
        <meshStandardMaterial color={"#8A5E08"} emissive={COLORS.amberDeep} emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.042, 0.055, 0.36, 10]} />
        <meshStandardMaterial
          color={COLORS.amberDeep}
          emissive={COLORS.amber}
          emissiveIntensity={0.45}
          roughness={0.42}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.155, 18, 14]} />
        <meshStandardMaterial
          color={COLORS.amber}
          emissive={COLORS.amber}
          emissiveIntensity={0.7}
          roughness={0.32}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.09, 0.48, 0.03]}>
        <sphereGeometry args={[0.085, 14, 12]} />
        <meshStandardMaterial
          color={COLORS.amberHot}
          emissive={COLORS.amber}
          emissiveIntensity={0.55}
          roughness={0.28}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

const Matrix: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = matrixOpacity(frame);
  const geoms = useMemo(
    () => FIBERS.map((pts) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.012, 5, false)),
    [],
  );
  return (
    <group>
      {geoms.map((geometry, index) => (
        <mesh key={index} geometry={geometry} position={[0, MEMBRANE_Y + 0.15, 0]}>
          <meshBasicMaterial color={"#3C5270"} transparent opacity={0.45 * fade} depthWrite={false} />
        </mesh>
      ))}
      {ANTIGENS.map((spec, index) => (
        <Antigen key={index} spec={spec} />
      ))}
    </group>
  );
};

export const DeliveryWorld: React.FC = () => {
  return (
    <>
      <CameraRig />
      <Lights />
      <fog attach="fog" args={[COLORS.cytosol, 16, 42]} />
      <Circulation />
      <Jig />
      <Nanoparticle />
      <Membrane />
      <Endosome />
      <Mrna />
      <Ribosome />
      <CytosolMotes />
      <Matrix />
    </>
  );
};
