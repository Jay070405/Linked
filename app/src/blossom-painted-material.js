import * as THREE from 'three';

// Paint lives in object space: the washes turn with the real petal instead of
// sliding over it. No external textures, environment map or specular lobe.
const vertexShader = /* glsl */ `
  #include <common>
  attribute float aPaintRadius;
  varying vec3 vPaintPoint;
  varying vec3 vPaintNormal;
  varying float vPaintRadius;

  void main() {
    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <project_vertex>
    vPaintPoint = position;
    vPaintNormal = inverseTransformDirection(transformedNormal, viewMatrix);
    vPaintRadius = aPaintRadius;
  }
`;

const fragmentShader = /* glsl */ `
  #include <common>
  uniform vec3 uBase;
  uniform vec3 uLight;
  uniform vec3 uShade;
  uniform vec3 uInk;
  uniform float uPetal;
  uniform float uSeed;
  uniform float uStoryDark;
  varying vec3 vPaintPoint;
  varying vec3 vPaintNormal;
  varying float vPaintRadius;

  float paperHash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * .1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  float washNoise(vec2 p) {
    vec2 cell = floor(p), local = fract(p);
    local = local * local * (3.0 - 2.0 * local);
    return mix(mix(paperHash(cell), paperHash(cell + vec2(1., 0.)), local.x),
               mix(paperHash(cell + vec2(0., 1.)), paperHash(cell + vec2(1.)), local.x), local.y);
  }

  void main() {
    vec3 n = normalize(vPaintNormal);
    // Soft, broad painted values retain volume without a polished highlight.
    float light = dot(n, normalize(vec3(-.55, .72, .90)));
    float middle = smoothstep(-.12, .42, light);
    float lit = smoothstep(.58, .92, light);
    vec3 color = mix(uShade, uBase, middle);
    color = mix(color, uLight, lit * .60);

    vec2 point = vPaintPoint.xy;
    vec2 seed = vec2(uSeed * 3.7, uSeed * 1.9);
    float broad = washNoise(point * vec2(3.8, 2.8) + seed);
    float wet = washNoise(point * vec2(11.0, 8.0) + seed + broad * .65);
    float wash = broad * .73 + wet * .27;
    // Uneven transparent pigment: broad blooms, not surface bumps or gritty noise.
    color = mix(color, uLight, smoothstep(.43, .80, wash) * .24);
    color = mix(color, uShade, (1.0 - smoothstep(.19, .47, wash)) * .17);

    if (uPetal > .5) {
      float root = 1.0 - smoothstep(.04, .59, point.y);
      color = mix(color, uInk, root * .24);

      float fan = atan(point.x, max(.055, point.y + .025));
      float veinPosition = fan * 17.0 + point.y * .62 + (broad - .5) * .40;
      float vein = 1.0 - smoothstep(.025, .10, abs(sin(veinPosition)));
      float veinFade = smoothstep(.12, .34, point.y) * (1.0 - smoothstep(.68, 1.15, point.y));
      color = mix(color, uInk, vein * veinFade * .055);

      // A slightly wandering pigment edge follows the actual closed petal shell.
      float edgeStart = .967 + (wet - .5) * .014;
      float edge = smoothstep(edgeStart, .998, vPaintRadius);
      float pooled = smoothstep(.84, .99, vPaintRadius) * (1.0 - edge);
      color = mix(color, uInk, pooled * .045 + edge * .28);
    }

    // Sub-pixel paper fibres fade out at a distance; they never become speckles.
    vec2 fibrePoint = point * vec2(210.0, 320.0) + seed;
    float footprint = max(length(dFdx(fibrePoint)), length(dFdy(fibrePoint)));
    float paperVisibility = 1.0 - smoothstep(.35, 1.25, footprint);
    float fibre = (washNoise(fibrePoint) - .5) * .010 * paperVisibility;
    color += vec3(fibre);

    gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
    #include <colorspace_fragment>
    // Keep the existing scroll handoff pixel-matched to the CSS reading scene.
    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(9.0/255.0, 9.0/255.0, 11.0/255.0), uStoryDark);
  }
`;

export function createPaintedBlossomMaterial({base, light, shade, ink, darkUniform, petal = false, seed = 0}) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uBase: {value: new THREE.Color(base)},
      uLight: {value: new THREE.Color(light)},
      uShade: {value: new THREE.Color(shade)},
      uInk: {value: new THREE.Color(ink)},
      uPetal: {value: petal ? 1 : 0},
      uSeed: {value: seed},
      uStoryDark: darkUniform,
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  // Tube/sphere geometry uses the same paint but has no petal-edge attribute.
  material.defaultAttributeValues.aPaintRadius = [0];
  return material;
}
