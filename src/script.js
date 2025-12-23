import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { deltaTime } from "three/tsl";

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
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

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
const emissionBlueMaterial = new THREE.MeshBasicMaterial({ color: 0xa7d5e7 });

let mixer;
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


  console.log(gltf)

  scene.add(gltf.scene);
});

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

  // Update mixer
  if (mixer) {
    mixer.update(deltaTime);
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
