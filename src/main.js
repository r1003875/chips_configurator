import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const chipsColor = new THREE.Color(0xe01b2f);
const lighter = chipsColor.clone().lerp(new THREE.Color("white"), 0.6);

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

const gltfLoader = new GLTFLoader();
gltfLoader.load('/assets/chips_bag/scene.gltf', (gltf)=>{
  const model = gltf.scene;
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
  scene.add(model);
  camera.position.set(0,1,2);
});

function animate() {
  renderer.render( scene, camera );
  controls.update();
}
