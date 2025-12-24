import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { Snowfall } from "./Snow/snowfall.js";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

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

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  300
);
camera.position.set(27.72101502698181, 5.275676269851925, 16.09621549208414);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(11.516876571401152, 1.0227020470847956, -6.426773274453287);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Create Snowfall Function
 */
function createSnowfallSystem() {
  if (snowSystem) {
    snowSystem.dispose(); // Clean up existing snow
  }

  // Create snow system WITHOUT options parameter
  snowSystem = Snowfall(scene, sizes);

  return snowSystem;
}

/**
 * Model
 */
function loadModel() {
  bakedTexture = new THREE.TextureLoader().load("./Baked3.jpg");
  bakedTexture.flipY = false;
  bakedTexture.colorSpace = THREE.SRGBColorSpace;
  const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

  const emissionMaterial = new THREE.MeshBasicMaterial({ color: 0xe7be99 });
  const emissionBlueMaterial = new THREE.MeshBasicMaterial({ color: 0xa7d5e7 });

  gltfLoader.load("baked3.glb", (gltf) => {
    currentModel = gltf.scene;

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name.toLowerCase().includes("emission-yellow")) {
          child.material = emissionMaterial;
        } else if (child.name.toLowerCase().includes("emission-blue")) {
          child.material = emissionBlueMaterial;
        } else {
          child.material = bakedMaterial;
        }
      }
    });

    // Animations
    mixer = new THREE.AnimationMixer(gltf.scene);

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
    const fwCarrier2 = mixer.clipAction(gltf.animations[7]);
    const fwCarrier3 = mixer.clipAction(gltf.animations[8]);
    const fwCarrier4 = mixer.clipAction(gltf.animations[9]);
    const fwCarrier5 = mixer.clipAction(gltf.animations[10]);
    const fwCarrier6 = mixer.clipAction(gltf.animations[11]);
    const fwCarrier7 = mixer.clipAction(gltf.animations[12]);
    const fwCarrier8 = mixer.clipAction(gltf.animations[13]);

    fw.play();
    fwCarrier1.play();
    fwCarrier2.play();
    fwCarrier3.play();
    fwCarrier4.play();
    fwCarrier5.play();
    fwCarrier6.play();
    fwCarrier7.play();
    fwCarrier8.play();

    scene.add(gltf.scene);

    // Create snowfall AFTER model is loaded
    createSnowfallSystem();
  });
}

// Load the model
loadModel();

/**
 * Snowfall Toggle Functions
 */
function toggleSnowfall(enable = true) {
  if (enable && !snowSystem) {
    // Create new snow system
    createSnowfallSystem();
  } else if (!enable && snowSystem) {
    // Remove existing snow
    snowSystem.dispose();
    snowSystem = null;
  }
}

// Add simple GUI control for snowfall toggle
const snowFolder = gui.addFolder("Snowfall");
snowFolder.add({ snow: true }, "snow").name("Enable Snow").onChange(toggleSnowfall);

// Add a reset button if you want
snowFolder.add({ reset: () => {
  if (snowSystem) {
    snowSystem.dispose();
    snowSystem = Snowfall(scene, sizes);
  }
}}, "reset").name("Reset Snow");

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
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

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
};

tick();

/**
 * Event Listeners for Cleanup
 */
window.addEventListener("beforeunload", () => {
  cleanupScene();
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});

// Add toggle button if you have one
document.getElementById("toggleSnow")?.addEventListener("click", () => {
  toggleSnowfall(!snowSystem);
});

// Add reset button if you have one
document.getElementById("resetScene")?.addEventListener("click", () => {
  cleanupScene();
  loadModel();
});