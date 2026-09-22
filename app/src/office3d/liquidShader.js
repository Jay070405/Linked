export const liquidVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const liquidFragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uClean;
uniform sampler2D uFantasy;
uniform float uAspect;
uniform float uImageAspect;
uniform float uTime;
uniform vec3 uHead;
uniform vec2 uVelocity;
uniform vec4 uTrail[24];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
}
float softMass(vec2 d, vec2 radius) {
  vec2 q = d / radius;
  return exp(-dot(q, q) * 1.65);
}
void main() {
  // Distances use the short viewport edge, so patches remain broad on phones.
  vec2 metric = vec2(max(uAspect, 1.), max(1. / uAspect, 1.));
  vec2 p = vUv * metric;
  float t = uTime * .13;
  vec2 warp = vec2(noise(p * 5.2 + vec2(t, -t * .6)),
                   noise(p * 5.2 + vec2(17.3 - t * .5, 9.2 + t))) - .5;
  vec2 liquid = p + warp * .076;

  vec2 head = uHead.xy * metric;
  vec2 d = liquid - head;
  float speed = min(length(uVelocity), 1.);
  vec2 dir = normalize(uVelocity + vec2(.0001, .0001));
  vec2 across = vec2(-dir.y, dir.x);
  vec2 flowing = vec2(dot(d, dir), dot(d, across));
  // Asymmetric overlapping masses, not a circular cursor mask. The second
  // lobe stays broad at rest and leans into the movement while the wake lags.
  float field = uHead.z * (
    softMass(flowing, vec2(.235 + speed * .07, .185)) * 1.12 +
    softMass(d + vec2(.093, -.067), vec2(.165, .155)) * .71 +
    softMass(d - vec2(.063, .095), vec2(.14, .13)) * .48
  );
  vec2 surfaceNormal = vec2(0.);
  for (int i = 0; i < 24; i++) {
    vec4 drop = uTrail[i];
    vec2 q = liquid - drop.xy * metric;
    float mass = softMass(q, vec2(max(drop.z, .001), max(drop.z * .84, .001))) * drop.w;
    field += mass;
    surfaceNormal += q * mass / max(drop.z * drop.z, .001);
  }
  surfaceNormal += d * uHead.z * 5.;
  float grain = noise(p * 13. + warp * 2. + vec2(-t, t * .5));
  float threshold = .60 + (grain - .5) * .105;
  float reveal = smoothstep(threshold - .13, threshold + .15, field);
  // Refraction cannot bend the center of either room, only the mixing edge.
  float edge = 4. * reveal * (1. - reveal);
  vec2 bend = normalize(surfaceNormal + warp * .6 + vec2(.0001));
  vec2 offset = (bend * .0038 + warp * .003) * edge / metric;
  vec2 cover = vec2(min(1., uAspect / uImageAspect),
                    min(1., uImageAspect / uAspect));
  vec2 uv = clamp((vUv + offset - .5) * cover + .5, .001, .999);
  vec3 clean = texture2D(uClean, uv).rgb;
  vec3 fantasy = texture2D(uFantasy, uv).rgb;
  gl_FragColor = vec4(mix(clean, fantasy, reveal), 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
