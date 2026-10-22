export const MEMBRANE_VERT = /* glsl */ `
uniform float uTime;
uniform float uDent;
uniform float uDome;
uniform float uWave;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vRadial;

float heightAt(vec2 xy) {
  float r2 = dot(xy, xy);
  float wave = sin(xy.x * 0.52 + uTime * 0.03) * uWave;
  wave += cos(xy.y * 0.38 - uTime * 0.024) * uWave;
  float dome = -r2 * uDome;
  float dent = exp(-r2 * 0.16) * uDent;
  return wave + dome - dent;
}

void main() {
  float h = heightAt(position.xy);
  vec3 p = position;
  p.z += h;
  float e = 0.14;
  float hx = heightAt(position.xy + vec2(e, 0.0)) - heightAt(position.xy - vec2(e, 0.0));
  float hy = heightAt(position.xy + vec2(0.0, e)) - heightAt(position.xy - vec2(0.0, e));
  vec3 n = normalize(vec3(-hx, -hy, 2.0 * e));
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  vRadial = length(position.xy);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const MEMBRANE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uRim;
uniform float uOpacity;
uniform vec3 uCam;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vRadial;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCam - vWorld);
  float fres = pow(1.0 - abs(dot(N, V)), 1.65);
  vec3 col = mix(uColor, uRim, fres * 0.82);
  float edge = smoothstep(16.0, 20.5, vRadial);
  float alpha = uOpacity * (0.4 + 0.55 * fres) * (1.0 - edge);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

export const ENDOSOME_VERT = /* glsl */ `
uniform float uTime;
uniform float uWobble;
varying vec3 vNormal;
varying vec3 vWorld;

void main() {
  vec3 p = position;
  float wob = sin(p.y * 7.5 + uTime * 0.16) * cos(p.x * 6.0 - uTime * 0.11);
  p += normalize(normal) * wob * uWobble;
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const ENDOSOME_FRAG = /* glsl */ `
precision highp float;
uniform float uHole;
uniform float uAcid;
uniform float uOpacity;
uniform vec3 uHoleDir;
uniform vec3 uCam;
varying vec3 vNormal;
varying vec3 vWorld;

void main() {
  vec3 N = normalize(vNormal);
  float open = dot(N, normalize(uHoleDir));
  float threshold = 1.08 - uHole * 1.35;
  if (open > threshold) discard;
  vec3 V = normalize(uCam - vWorld);
  float fres = pow(1.0 - abs(dot(N, V)), 1.75);
  vec3 cool = vec3(0.10, 0.14, 0.24);
  vec3 acid = vec3(0.35, 0.85, 0.72);
  vec3 col = mix(cool, acid, uAcid * 0.72);
  col = mix(col, vec3(0.55, 0.96, 0.90), fres * 0.65);
  float lip = smoothstep(threshold - 0.22, threshold, open);
  col = mix(col, vec3(0.0, 0.96, 0.83), lip * 0.85);
  float alpha = uOpacity * (0.18 + 0.7 * fres);
  gl_FragColor = vec4(col, alpha);
}
`;
