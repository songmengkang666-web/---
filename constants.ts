export const TREE_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uExplosion; // 0.0 = Tree, 1.0 = Exploded
  uniform float uBeat;      // 0.0 to 1.0
  
  attribute vec3 aRandomDir;
  attribute float aSize;
  attribute float aOffset; // Random offset for sparkling
  attribute vec3 aColor;

  varying vec3 vColor;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vColor = aColor;
    
    vec3 pos = position;

    // Audio Beat Effect (Pulse outward slightly from center)
    vec3 pulse = normalize(pos) * uBeat * 0.5;
    pos += pulse;

    // Explosion Effect (Interpolate to exploded position)
    // Exploded position is original pos + random direction * scalar
    vec3 explodedPos = pos + aRandomDir * 15.0; 
    
    vec3 finalPos = mix(pos, explodedPos, uExplosion);

    // Add some gentle floating movement
    finalPos.y += sin(uTime * 2.0 + aOffset) * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // Size attenuation
    float beatScale = 1.0 + uBeat * 2.0;
    gl_PointSize = aSize * beatScale * (300.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const TREE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying vec2 vUv;

  void main() {
    // Circular particle
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Gradient glow from center
    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 1.5);

    gl_FragColor = vec4(vColor, glow);
  }
`;

export const STAR_VERTEX_SHADER = `
  uniform float uTime;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Simple rotation
    float angle = uTime;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);
    pos.xy = rot * pos.xy;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const STAR_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform float uBeat;

  void main() {
    float dist = distance(vUv, vec2(0.5));
    float glow = 0.05 / dist;
    vec3 color = vec3(1.0, 0.9, 0.4) * glow;
    gl_FragColor = vec4(color * (1.0 + uBeat), 1.0);
  }
`;
