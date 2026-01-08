import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GUI } from 'dat.gui';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { add, sub } from 'three/tsl';

const API_URL = import.meta.env.VITE_API_URL;

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
const dashboardURL = import.meta.env.VITE_DASHBOARD_URL;

if (!token) {
  window.location.href = `${dashboardURL}/login`;
}


const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

let chipsColor = new THREE.Color("#ffffff");
let model = null;
let targetMesh = null;

let colorInput = document.querySelector("#color");
colorInput.addEventListener("input", (e)=>{
    updateChipsColor(e.target.value);
});

let lighter = chipsColor.clone().lerp(new THREE.Color("white"), 0.6);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 );
scene.add( camera );

const light = new THREE.AmbientLight(0x404040);
light.intensity = 50;
scene.add(light);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
scene.add( directionalLight );

const hdrLoader = new HDRLoader();
hdrLoader.load('/assets/bg.hdr', function(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
});

light.intensity = 2;

const canvas = document.querySelector(".webgl");
const renderer = canvas ? new THREE.WebGLRenderer({canvas}) : new THREE.WebGLRenderer();
renderer.setSize( sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setAnimationLoop( animate );
if (!canvas) document.body.appendChild( renderer.domElement );
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
const controls = new OrbitControls( camera, canvas || renderer.domElement );
controls.enableDamping = true;
controls.enablePan = false;
controls.minPolarAngle = Math.PI * 0.35;  
controls.maxPolarAngle = Math.PI * 0.55; 
controls.minDistance = 1.2;
controls.maxDistance = 5;

const loadingManager = new THREE.LoadingManager();
const loadingOverlay = document.createElement('div');
loadingOverlay.style.position = 'fixed';
loadingOverlay.style.zIndex = '9999';
loadingOverlay.style.top = '0';
loadingOverlay.style.left = '0';
loadingOverlay.style.width = '100%';
loadingOverlay.style.height = '100%';
loadingOverlay.style.backgroundColor = '#fcd703';
loadingOverlay.style.color = 'black';
loadingOverlay.style.display = 'flex';
loadingOverlay.style.alignItems = 'center';
loadingOverlay.style.justifyContent = 'center';
loadingOverlay.innerText = 'Finding Chips...';
document.body.appendChild(loadingOverlay);

loadingManager.onLoad = () => {
  loadingOverlay.style.display = 'none';
};

const plateGeometry = new THREE.CircleGeometry(1.5,32);
const plateMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 0.2, roughness: 0.4});
const plate = new THREE.Mesh(plateGeometry, plateMaterial);
plate.position.set(0,-1,0);
plate.rotation.x = - Math.PI / 2;
plate.receiveShadow = true;
scene.add(plate);

const logo = new THREE.TextureLoader().load('/assets/Lays-Logo.png');
const gltfLoader = new GLTFLoader(loadingManager);

gltfLoader.load('/assets/chips_bag/scene.gltf', (gltf) => {
  model = gltf.scene;

  // Kies expliciet één van de twee meshes
  // (Gebruik .getObjectByName als de naam exact is)
  targetMesh = model.getObjectByName('Plane_Material001_0') 
            || model.getObjectByName('Plane_Material001_0_1');

  // Als je niet zeker bent welke de zak is, log ze:
  model.traverse((o) => {
    if (o.isMesh) console.log('Mesh:', o.name, o);
  });

  // Laat bestaande textures ongemoeid; kleur alleen “texture-loze” onderdelen
  model.traverse((child) => {
    if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
            color: chipsColor, 
            metalness: 0.7, 
            roughness: 0.5
        });
    }
  });

  model.scale.set(0.5, 0.5, 0.5);
  model.castShadow = true;
  scene.add(model);
  camera.position.set(0, 1, 2);

  // Plaats het decal op de voorkant (Variant B)
  addFrontDecal(targetMesh, logo);
});

/*
gltfLoader.load('/assets/chips_bag/scene.gltf', (gltf)=>{
  model = gltf.scene;
  model.traverse((child) => {
    if(child.isMesh && !targetMesh) {
      targetMesh = child;
    }
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
  addFrontDecal(targetMesh, logo);
  model.traverse(o => console.log(o.type, o.name))
});
*/

/*
gltfLoader.load('/assets/chips_arthur_de_klerck.glb', (gltf)=>{
  model = gltf.scene;
  model.scale.set(0.5,0.5,0.5);
  model.position.set(0,0,0);
  model.rotation.y = Math.PI / 4;
  scene.add(model);
  console.log(model)
  console.log(model.children[0].material)
});*/

const gui = new GUI();
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '10px';
gui.domElement.style.left = '10px';
gui.close();

const plateFolder = gui.addFolder('Plate');
plateFolder.add(plate.position, 'x', -10, 10);
plateFolder.add(plate.position, 'y', -10, 10);
plateFolder.add(plate.position, 'z', -10, 10);
plateFolder.open();

const updateChipsColor = (newColor) => {
  chipsColor = new THREE.Color(newColor);
  lighter = chipsColor.clone().lerp(new THREE.Color("white"), 0.2);
  plate.material.color.copy(lighter);
  if (model) {
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const isDecal = child.material.map === logo;
        const hasTexture = !!child.material.map;
        if (!isDecal && !hasTexture && child.material.color) {
          child.material.color.copy(chipsColor);
        }
      }
    });
  }
};

function animate() {
  renderer.render( scene, camera );
  controls.update();
}


function addFrontDecal() {
  if (!targetMesh) return;

  // Bepaal een positie roughly aan de voorkant:
  const box = new THREE.Box3().setFromObject(targetMesh);
  const center = box.getCenter(new THREE.Vector3());
  const zFront = (box.max.z + box.min.z) / 2; // alternatief: box.max.z
  const position = new THREE.Vector3(center.x, center.y, zFront);

  // Laat het logo naar buiten wijzen (Z-as)
  const normal = new THREE.Vector3(0, 0, 1);
  const orientation = new THREE.Euler()
    .setFromQuaternion(new THREE.Quaternion()
    .setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal));

  const size = new THREE.Vector3(0.25, 0.15, 0.02);

  const geom = new DecalGeometry(targetMesh, position, orientation, size);
  const mat = new THREE.MeshBasicMaterial({
    map: logo,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -0.1
  });

  const decal = new THREE.Mesh(geom, mat);
  scene.add(decal);
}

const form = document.querySelector("#configurator_form");
form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const name = document.querySelector("#name").value;
    const font = document.querySelector("#font").value;
    const color = document.querySelector("#color").value;
    const imageInput = document.querySelector("#image").files[0];
    const flavours = document.querySelector("#flavours").value.split(',').map(f => f.trim());
    renderer.render(scene, camera);
    const screenshotDataUrl = renderer.domElement.toDataURL("image/png");
    const screenshotFile = dataURLtoFile(screenshotDataUrl, "bag-preview.png");
/*
    const payload = {
        name: name,
        font: font,
        color: color,
        keyFlavours: flavours,
        image: imageInput,
        user: "69591cc01c1b4e01957eb959" // Voorbeeld user ID
    }*/

    const formData = new FormData();
    formData.append("name", name);
    formData.append("font", font);
    formData.append("color", color);
    formData.append("keyFlavours", JSON.stringify(flavours));
    if (imageInput) {
      formData.append("image", imageInput);
    }
    formData.append("user", "69591cc01c1b4e01957eb959"); // Voorbeeld user ID
    formData.append("screenshot", screenshotFile);
    try {
      const response = await fetch(`${API_URL}/bags`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

    const result = await response.json();
    console.log("Success:", result);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
    // change submit button to "Submitted!" for 2 seconds
    const submitBtn = document.querySelector(".submit_btn");
    const continueBtn = document.querySelector(".continue_btn");
    continueBtn.classList.remove("hidden");
    continueBtn.addEventListener("click", ()=>{
        window.location.href = `${dashboardURL}/voting?token=${token}`;
    });
    submitBtn.innerText = "Submitted!";
    submitBtn.disabled = true;
    submitBtn.classList.add("submitted");
});

function reset(){
    document.querySelector("#configurator_form").reset();
    updateChipsColor("#ffffff");
}

const resetBtn = document.querySelector(".reset_btn");
resetBtn.addEventListener("click", reset);

function dataURLtoFile(dataUrl, filename) {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}