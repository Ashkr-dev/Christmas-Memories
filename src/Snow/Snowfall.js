import * as THREE from "three";
import snowVertexShader from "/Shaders/Snow/vertex.glsl";
import snowFragmentShader from "/Shaders/Snow/fragment.glsl";

export function Snowfall(scene, sizes, gui, debugObject) {
  // Debug
  debugObject.particleCount = 5000;
  debugObject.particleSize = 0.5;
  debugObject.opacity = 0.8;
  debugObject.color = 0xffffff;
  debugObject.snowflakeMinScale = 0.3;
  debugObject.snowflakeMaxScale = 50.0;

  const particleCount = debugObject.particleCount;
  const centerX = 11.5;
  const centerZ = -6.4;
  const width = 35;
  const depth = 35;
  const minHeight = 0;
  const maxHeight = 35;
  const particleSize = debugObject.particleSize;
  const opacity = debugObject.opacity;
  const color = debugObject.color;

  // Geometry
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  // Setup particles
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Position
    positions[i3] = centerX + (Math.random() - 0.5) * width * 2;
    positions[i3 + 1] = Math.random() * (maxHeight - minHeight) + minHeight;
    positions[i3 + 2] = centerZ + (Math.random() - 0.5) * depth * 2;

    // Size variation (0.5 to 1.5)
    scales[i] = Math.random() * 1.0 + 0.5;
  }

  // Set attributes
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

  // Texture
  const textureLoader = new THREE.TextureLoader();
  const snowflakeTexture = textureLoader.load("/snowflake/snowflake3.jpg");

  // Material
  const material = new THREE.ShaderMaterial({
    vertexShader: snowVertexShader,
    fragmentShader: snowFragmentShader,
    uniforms: {
      uTime: new THREE.Uniform(0),
      uSize: new THREE.Uniform(particleSize),
      uColor: new THREE.Uniform(new THREE.Color(color)),
      uOpacity: new THREE.Uniform(opacity),
      uTexture: new THREE.Uniform(snowflakeTexture),
      uResolution: new THREE.Uniform(
        new THREE.Vector2(sizes.width, sizes.height)
      ),
      uPixelRatio: new THREE.Uniform(sizes.pixelRatio),
      uSnowflakeMinScale: new THREE.Uniform(debugObject.snowflakeMinScale),
      uSnowflakeMaxScale: new THREE.Uniform(debugObject.snowflakeMaxScale),
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Create snow
  const snow = new THREE.Points(geometry, material);
  scene.add(snow);

  // Update function
  function update() {
    material.uniforms.uTime.value = performance.now() * 0.001;

    const positions = geometry.attributes.position.array;
    const scales = geometry.attributes.aScale.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const scale = scales[i];

      // Move down (bigger flakes fall faster)
      positions[i3 + 1] -= 0.01 + scale * 0.01;

      // Add horizontal sway
      positions[i3] += Math.sin(performance.now() * 0.001 + i3) * 0.01 * scale;

      // Reset if below ground
      if (positions[i3 + 1] < 0) {
        positions[i3] = centerX + (Math.random() - 0.5) * width * 2;
        positions[i3 + 1] = Math.random() * (maxHeight - minHeight) + minHeight;
        positions[i3 + 2] = centerZ + (Math.random() - 0.5) * depth * 2;
      }
    }

    geometry.attributes.position.needsUpdate = true;
  }

  // Cleanup
  function dispose() {
    scene.remove(snow);
    geometry.dispose();
    material.dispose();
    snowflakeTexture.dispose();
  }

  // Return API
  return {
    update,
    dispose,
    getSnow: () => snow,
  };
}
