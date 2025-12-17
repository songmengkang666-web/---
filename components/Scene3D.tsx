import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TREE_VERTEX_SHADER, TREE_FRAGMENT_SHADER, STAR_VERTEX_SHADER, STAR_FRAGMENT_SHADER } from '../constants';
import { TreeSettings, UserPhoto } from '../types';

interface Scene3DProps {
  settings: TreeSettings;
  beatIntensity: number;
  explosionFactor: number;
  userPhotos: UserPhoto[];
  onSceneReady: (scene: THREE.Scene) => void;
}

export const Scene3D: React.FC<Scene3DProps> = ({ 
  settings, 
  beatIntensity, 
  explosionFactor, 
  userPhotos,
  onSceneReady 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const starMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const photoMeshesRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<THREE.Points | null>(null);
  const snowSystemRef = useRef<THREE.Points | null>(null);

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    onSceneReady(scene);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Resize Handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []); // Only run once

  // Build Tree Particles
  useEffect(() => {
    if (!sceneRef.current) return;

    // Cleanup old tree
    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current);
      particlesRef.current.geometry.dispose();
    }

    const particleCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const randomDirs = [];
    const sizes = [];
    const offsets = [];

    const treeHeight = settings.height;
    const baseRadius = 3.5;

    for (let i = 0; i < particleCount; i++) {
      // Helix Math
      const t = i / particleCount;
      const angle = t * 30.0; // Spirals
      const y = t * treeHeight - (treeHeight / 2); // Center y
      const radius = (1.0 - t) * baseRadius; // Cone tapering

      // Base Position
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Add randomness for volume
      const variance = 0.3;
      const finalX = x + (Math.random() - 0.5) * variance;
      const finalY = y + (Math.random() - 0.5) * variance;
      const finalZ = z + (Math.random() - 0.5) * variance;

      positions.push(finalX, finalY, finalZ);

      // Random Direction for Explosion (Outward sphere vector)
      const rDir = new THREE.Vector3(finalX, finalY, finalZ).normalize();
      randomDirs.push(rDir.x, rDir.y, rDir.z);

      // Colors: Green mix with some Gold/Red for ornaments
      const rand = Math.random();
      if (rand > 0.9) {
        colors.push(1.0, 0.84, 0.0); // Gold
        sizes.push(settings.particleSize * 2.5);
      } else if (rand > 0.85) {
        colors.push(1.0, 0.0, 0.0); // Red
        sizes.push(settings.particleSize * 2.5);
      } else {
        colors.push(0.1, 0.8 + Math.random() * 0.2, 0.2); // Green variance
        sizes.push(settings.particleSize);
      }

      offsets.push(Math.random() * 100);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aRandomDir', new THREE.Float32BufferAttribute(randomDirs, 3));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('aOffset', new THREE.Float32BufferAttribute(offsets, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: TREE_VERTEX_SHADER,
      fragmentShader: TREE_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uExplosion: { value: 0 },
        uBeat: { value: 0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    materialRef.current = material;

    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    sceneRef.current.add(particles);

    // Add Star on Top
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, treeHeight / 2 + 0.5, 0], 3));
    const starMat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
      uniforms: { uTime: { value: 0 }, uBeat: { value: 0 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    starMaterialRef.current = starMat;
    const star = new THREE.Points(starGeo, starMat);
    // Make star bigger
    starMat.extensions = { derivatives: true }; // Enable derivatives if needed for advanced effects
    (star as any).material.size = 200; // Need a way to set point size in vertex shader or just sprite
    // Actually, shader doesn't set point size for star, let's just use a Sprite for the Star or fix shader
    // The STAR_VERTEX_SHADER provided is basic. Let's rely on standard sprite for the star to be safe.
    
    // Replacing shader star with simpler Sprite for robustness
    const starTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/star.png');
    const spriteMat = new THREE.SpriteMaterial({ map: starTexture, color: 0xffff00, blending: THREE.AdditiveBlending });
    const starSprite = new THREE.Sprite(spriteMat);
    starSprite.position.set(0, treeHeight/2 + 0.2, 0);
    starSprite.scale.set(1.5, 1.5, 1.0);
    starSprite.name = "TopStar";
    
    const oldStar = sceneRef.current.getObjectByName("TopStar");
    if (oldStar) sceneRef.current.remove(oldStar);
    sceneRef.current.add(starSprite);

  }, [settings.height, settings.particleSize]);

  // Handle User Photos
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Clear old photos
    if (photoMeshesRef.current) {
      sceneRef.current.remove(photoMeshesRef.current);
    }

    const group = new THREE.Group();
    photoMeshesRef.current = group;

    const loader = new THREE.TextureLoader();

    userPhotos.forEach((photo, i) => {
      // Create texture if not cached
      if (!photo.texture) {
        photo.texture = loader.load(photo.url);
      }
      
      const geometry = new THREE.PlaneGeometry(1, 1);
      // Circle mask via fragment shader or alpha map?
      // Simplest: Use a circle texture as alphaMap
      const material = new THREE.MeshBasicMaterial({ 
        map: photo.texture,
        transparent: true,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      
      // Random position within tree volume
      const t = Math.random();
      const angle = Math.random() * Math.PI * 2;
      const radius = (1.0 - t) * 3.0 * Math.random();
      const y = t * settings.height - (settings.height / 2);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      mesh.position.set(x, y, z);
      // Store original pos for morphing
      mesh.userData = { 
        originalPos: new THREE.Vector3(x, y, z),
        randomDir: new THREE.Vector3(x, y, z).normalize() 
      };

      // Random scale
      const s = 0.5 + Math.random() * 0.5;
      mesh.scale.set(s, s, s);

      group.add(mesh);
    });

    sceneRef.current.add(group);

  }, [userPhotos, settings.height]);

  // Snow System
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const count = 1000;
    const geo = new THREE.BufferGeometry();
    const pos = [];
    for(let i=0; i<count; i++) {
        pos.push((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8 });
    const snow = new THREE.Points(geo, mat);
    snowSystemRef.current = snow;
    sceneRef.current.add(snow);
  }, []);

  // Animation Loop
  useEffect(() => {
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const time = performance.now() * 0.001;

      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = time;
        materialRef.current.uniforms.uBeat.value = beatIntensity * settings.sensitivity;
        
        // Smooth dampening for explosion
        // Actually, we pass explosionFactor directly from props which is controlled by React state/Vision
        materialRef.current.uniforms.uExplosion.value = explosionFactor; 
      }

      if (starMaterialRef.current) {
         starMaterialRef.current.uniforms.uTime.value = time;
         starMaterialRef.current.uniforms.uBeat.value = beatIntensity;
      }

      // Rotate Tree
      if (particlesRef.current) {
        particlesRef.current.rotation.y += settings.rotationSpeed * 0.01;
      }

      // Update Photos (Explosion & Facing Camera)
      if (photoMeshesRef.current && cameraRef.current) {
        photoMeshesRef.current.children.forEach((child) => {
          const mesh = child as THREE.Mesh;
          const { originalPos, randomDir } = mesh.userData;
          
          // Explosion Logic
          const targetPos = originalPos.clone().add(randomDir.clone().multiplyScalar(15.0));
          mesh.position.copy(originalPos).lerp(targetPos, explosionFactor);
          
          // Billboard
          mesh.lookAt(cameraRef.current!.position);
        });
        // Rotate the whole photo group with the tree
        photoMeshesRef.current.rotation.y += settings.rotationSpeed * 0.01;
      }

      // Snow Fall
      if (snowSystemRef.current) {
          const positions = snowSystemRef.current.geometry.attributes.position.array as Float32Array;
          for(let i=1; i<positions.length; i+=3) {
              positions[i] -= 0.05;
              if(positions[i] < -10) positions[i] = 10;
          }
          snowSystemRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();
  }, [settings, beatIntensity, explosionFactor]); // Re-bind animate if these change significantly? No, refs handle values, deps trigger restarts.

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
};
