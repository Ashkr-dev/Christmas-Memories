import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { Snowfall } from "./Snow/Snowfall.js";
import smokeVertexShader from "./Shaders/Smoke/vertex.glsl";
import smokeFragmentShader from "./Shaders/Smoke/fragment.glsl";
import Stats from "stats.js";
import { Music } from "./Music/music.js";

// ===========
// Stats.js
//==========
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

/**
 * Music
 */
const music = new Music();

/**
 * Base
 */
// Debug
const gui = new GUI();
gui.close();
const debugObject = {};
debugObject.smokeUvY = 0.216;
debugObject.smokeUvX = 0.327;
debugObject.smokeColor = "#e7be99";

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

//========
// FOG
//========
debugObject.fogColor = 0x6693aa;
debugObject.fogDensity = 0.015;
scene.fog = new THREE.FogExp2(debugObject.fogColor, debugObject.fogDensity);
const fog = gui.addFolder("Fog");
fog.addColor(debugObject, "fogColor").onChange(() => {
  scene.fog.color.set(debugObject.fogColor);
});
fog.add(debugObject, "fogDensity", 0.001, 0.05, 0.0001).onChange(() => {
  scene.fog.density = debugObject.fogDensity;
});

// Don't create snow yet - wait until model is loaded
let snowSystem = null;

// Loaders
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Store for cleanup
let bakedTexture = null;
let mixer = null;
let currentModel = null;

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
sizes.resolution = new THREE.Vector2(
  sizes.width * sizes.pixelRatio,
  sizes.height * sizes.pixelRatio
);

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);
  sizes.resolution.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio
  );

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

//===========
// Cursor Events
//===========
let needsRaycast = true;
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  needsRaycast = true; // Only set flag on mouse move
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  250
);
camera.position.set(27.72101502698181, 5.275676269851925, 16.09621549208414);
// Update projection matrix only when needed
camera.aspect = sizes.width / sizes.height;
camera.updateProjectionMatrix();
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(11.516876571401152, 1.0227020470847956, -6.426773274453287);
controls.enableDamping = true;
controls.dampingFactor = 0.05; // Default is 0.05, increase for less smoothing

// // Disable unnecessary features
// controls.enablePan = false; // If not needed
// controls.enableZoom = true;
// controls.enableRotate = true;

controls.minDistance = 5;
controls.maxDistance = 50;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minAzimuthAngle = 0.1;
controls.maxAzimuthAngle = Math.PI / 2.1;
controls.update();

// Update only when needed
controls.addEventListener("change", () => {
  needsRaycast = true; // Update raycast when camera moves
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: "high-performance", // Add this
  precision: "highp", // or "mediump" for better performance
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
// Add these settings
renderer.autoClear = true;
renderer.sortObjects = true; // Helps with transparency rendering order
renderer.outputColorSpace = THREE.SRGBColorSpace; // Standard for web

/**
 * Create Snowfall Function
 */
function createSnowfallSystem() {
  if (snowSystem) {
    snowSystem.dispose(); // Clean up existing snow
  }

  // Create snow system WITHOUT options parameter
  snowSystem = Snowfall(scene, sizes, gui, debugObject);

  return snowSystem;
}

//===========
// Raycaster
//===========
const raycaster = new THREE.Raycaster();
let currentIntersect = null;
const originalScales = new Map(); // Store original scales

/**
 * Model
 */
const perlinTexture = textureLoader.load("./perlin.png");
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

let smokeMaterial = null;
let presentBoxes = [];
function loadModel() {
  bakedTexture = new THREE.TextureLoader().load("./Baked3.webp");
  bakedTexture.flipY = false;
  bakedTexture.colorSpace = THREE.SRGBColorSpace;
  bakedTexture.generateMipmaps = true;
  bakedTexture.minFilter = THREE.LinearMipmapLinearFilter;
  bakedTexture.magFilter = THREE.LinearFilter;
  bakedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
  const emissionMaterial = new THREE.MeshBasicMaterial({ color: 0xe7be99 });
  const emissionBlueMaterial = new THREE.MeshBasicMaterial({ color: 0xa7d5e7 });
  smokeMaterial = new THREE.ShaderMaterial({
    vertexShader: smokeVertexShader,
    fragmentShader: smokeFragmentShader,
    uniforms: {
      uTime: new THREE.Uniform(0),
      uTexture: new THREE.Uniform(perlinTexture),
      uSmokeColor: new THREE.Uniform(new THREE.Color(debugObject.smokeColor)),
      uSmokeUvX: new THREE.Uniform(debugObject.smokeUvX),
      uSmokeUvY: new THREE.Uniform(debugObject.smokeUvY),
    },
    side: THREE.DoubleSide,
    // wireframe: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  gltfLoader.load("baked7.glb", (gltf) => {
    currentModel = gltf.scene;

    presentBoxes = [];
    originalScales.clear(); // Clear previous scales

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name.toLowerCase().includes("emission-yellow")) {
          child.material = emissionMaterial;
        } else if (child.name.toLowerCase().includes("emission-blue")) {
          child.material = emissionBlueMaterial;
        } else if (child.name.toLowerCase().includes("smoke")) {
          child.material = smokeMaterial;
        } else if (child.name.toLowerCase().includes("presents")) {
          presentBoxes.push(child);
          originalScales.set(child, child.scale.clone()); // Store original scale
          child.material = bakedMaterial;
        } else {
          child.material = bakedMaterial;
        }
      }
    });

    // Animations
    mixer = new THREE.AnimationMixer(currentModel);

    if (gltf.scene) {
      // Toy Train animation
      const ttengine = mixer.clipAction(gltf.animations[0]);
      const ttcarrier = mixer.clipAction(gltf.animations[1]);
      const ttcarrier2 = mixer.clipAction(gltf.animations[2]);
      const bezier = mixer.clipAction(gltf.animations[4]);

      ttengine.play();
      ttcarrier.play();
      ttcarrier2.play();
      bezier.play();

      // Ferris Wheel animation
      const fw = mixer.clipAction(gltf.animations[3]);
      const fwCarrier1 = mixer.clipAction(gltf.animations[6]);
      const fwCarrier7 = mixer.clipAction(gltf.animations[5]);
      const fwCarrier2 = mixer.clipAction(gltf.animations[7]);
      const fwCarrier3 = mixer.clipAction(gltf.animations[8]);
      const fwCarrier4 = mixer.clipAction(gltf.animations[9]);
      const fwCarrier5 = mixer.clipAction(gltf.animations[10]);
      const fwCarrier6 = mixer.clipAction(gltf.animations[11]);

      fw.play();
      fwCarrier1.play();
      fwCarrier2.play();
      fwCarrier3.play();
      fwCarrier4.play();
      fwCarrier5.play();
      fwCarrier6.play();
      fwCarrier7.play();
    }

    scene.add(currentModel);

    // Create snowfall AFTER model is loaded
    createSnowfallSystem();
  });
}
loadModel();

// Gui
const smoke = gui.addFolder("Smoke");
smoke.addColor(debugObject, "smokeColor").onChange(() => {
  smokeMaterial.uniforms.uSmokeColor.value.set(debugObject.smokeColor);
});
smoke.add(debugObject, "smokeUvX", 0, 1).onChange(() => {
  smokeMaterial.uniforms.uSmokeUvX.value = debugObject.smokeUvX;
});
smoke.add(debugObject, "smokeUvY", 0, 1).onChange(() => {
  smokeMaterial.uniforms.uSmokeUvY.value = debugObject.smokeUvY;
});

/**
 * Cleanup Function
 */
function cleanupScene() {
  // Remove snow
  if (snowSystem) {
    snowSystem.dispose();
    snowSystem = null;
  }

  // Remove model
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  // Dispose mixer
  if (mixer) {
    mixer.stopAllAction();
    mixer = null;
  }

  // Dispose textures
  if (bakedTexture) {
    bakedTexture.dispose();
    bakedTexture = null;
  }

  console.log("Scene cleaned up");
}

/**
 * Animation loop cleanup helper
 */
let animationId = null;

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  stats.begin();
  // Update clock
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Cast a Ray

  if (needsRaycast && presentBoxes && presentBoxes.length > 0) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(presentBoxes, false);
    needsRaycast = false;
    if (intersects.length) {
      const intersectedObject = intersects[0].object;

      currentIntersect = intersectedObject;
    } else {
      currentIntersect = null;
    }

    // Smooth scale animation for all presents
    presentBoxes.forEach((present) => {
      const originalScale = originalScales.get(present);
      if (originalScale) {
        const targetScale =
          present === currentIntersect
            ? originalScale.clone().multiplyScalar(1.3)
            : originalScale.clone();

        // Smooth interpolation
        present.scale.lerp(targetScale, 0.2);
      }
    });
  }

  // Update Smoke
  smokeMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Update snowfall if it exists
  if (snowSystem) {
    snowSystem.update();
  }

  // Update mixer
  if (mixer) {
    mixer.update(deltaTime);
  }

  // Render
  renderer.render(scene, camera);

  // Store animation frame ID for cleanup
  animationId = window.requestAnimationFrame(tick);

  stats.end();
};

tick();
