import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  300
);
camera.position.x = 8;
camera.position.y = 10;
camera.position.z = 12;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.y = 3;
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Model
 */
const bakedTexture = new THREE.TextureLoader().load("./Baked3.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;
console.log(bakedTexture);
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

const emissionMaterial = new THREE.MeshBasicMaterial({ color: 0xe7be99 });
const emissionBlueMaterial = new THREE.MeshBasicMaterial({ color: 0xA7D5E7});

gltfLoader.load("baked3.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      // Check if name contains "emission" (case-insensitive)
      if (child.name.toLowerCase().includes("emission-yellow")) {
        child.material = emissionMaterial;
      } else if (child.name.toLowerCase().includes("emission-blue")) {
        child.material = emissionBlueMaterial;

      } else {
        child.material = bakedMaterial;
      }
    }

  });
  scene.add(gltf.scene);

});
/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
