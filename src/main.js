import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

let chipsColor = new THREE.Color("#ffffff");
let model = null;

const updateChipsColor = (newColor) => {
  chipsColor = new THREE.Color(newColor);
  lighter = chipsColor.clone().lerp(new THREE.Color("white"), 0.6);
  scene.background = new THREE.Color(lighter);
  if (model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.material.color.copy(chipsColor);
      }
    });
  }
};

let colorInput = document.querySelector("#color");
colorInput.addEventListener("input", (e)=>{
    updateChipsColor(e.target.value);
});

let lighter = chipsColor.clone().lerp(new THREE.Color("white"), 0.6);

const scene = new THREE.Scene();
scene.background = new THREE.Color(lighter);

const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 );
scene.add( camera );

const light = new THREE.AmbientLight(0x404040);
light.intensity = 50;
scene.add(light);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
scene.add( directionalLight );

const canvas = document.querySelector(".webgl");
const renderer = canvas ? new THREE.WebGLRenderer({canvas}) : new THREE.WebGLRenderer();
renderer.setSize( sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setAnimationLoop( animate );
if (!canvas) document.body.appendChild( renderer.domElement );
const controls = new OrbitControls( camera, canvas || renderer.domElement );
controls.enableDamping = true;
controls.enablePan = false;
controls.minPolarAngle = Math.PI * 0.45;  
controls.maxPolarAngle = Math.PI * 0.55; 
controls.minDistance = 1.2;
controls.maxDistance = 5;

const gltfLoader = new GLTFLoader();
gltfLoader.load('/assets/chips_bag/scene.gltf', (gltf)=>{
  model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
            color: chipsColor, 
            metalness: 0.7, 
            roughness: 0.5
        });
    }
  });
  model.scale.set(0.5,0.5,0.5);
  model.castShadow = true;
  scene.add(model);
  camera.position.set(0,1,2);
});

const plateGeometry = new THREE.CircleGeometry(1.5,32);
const plateMaterial = new THREE.MeshStandardMaterial({color: 0xb0b0b0, metalness: 0.2, roughness: 0.4});
const plate = new THREE.Mesh(plateGeometry, plateMaterial);
plate.position.set(0,-1,0);
plate.rotation.x = - Math.PI / 2;
plate.receiveShadow = true;
scene.add(plate);

function animate() {
  renderer.render( scene, camera );
  controls.update();
}
