import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

import Stats from './three/examples/jsm/libs/stats.module.js';
import * as dat from './three/examples/jsm/libs/lil-gui.module.min.js';

import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from './cannon-es.js'

import CharacterController from './characterController.js';


/*
* Debug GUI
*/
const debugObject = {
    deepcolor: 0x142e39,
    surfacecolor: 0x98caf0,
    scenecolor: 0x22243A,
    ambientlight: 0x96cbfd
}

/*
* Canvas
*/
const canvas = document.querySelector('#canvas' );
let stats,info,plane;
let camera, scene, renderer,controls;
let world;

let characterControllerInstance;
const keysPressed = {ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false, ' ':false};
let shiftToggle=false;

const clock=new THREE.Clock();
function hasWebGL() {
    const gl =canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && gl instanceof WebGLRenderingContext) {
        init();
        requestAnimationFrame(render);
    } else {
        console.log("Your browser does not support webGL");
    }
}
hasWebGL();

function init() {

    info = document.querySelector('#info' );
    stats = new Stats();
    info.appendChild( stats.dom );

    // ***** RENDERER ****** //
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.shadowMap.enabled=true

    // ***** CAMERA ****** //
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 400;
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far);

    // ***** SCENE & FOG ****** //
    scene = new THREE.Scene();
    scene.background = new THREE.Color( debugObject.scenecolor );
    scene.fog = new THREE.FogExp2( 0x22243A,0.005);

    // ***** LIGHTS ****** //
    scene.add( new THREE.AmbientLight( debugObject.ambientlight, 0.2 ) );
    const light=new THREE.DirectionalLight(0xffffff,0.8);
    light.position.set(-50,50,50)
    light.castShadow=true
    const helper=new THREE.DirectionalLightHelper(light,5)
    scene.add(light)

    // ***** LOADERS ****** //
    const textureLoader = new THREE.TextureLoader()
    const loader = new GLTFLoader();


    const geometry = new THREE.PlaneBufferGeometry( 1024, 1024 );
    plane = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial({color: 0x22243a}) );
    plane.rotation.x= -Math.PI *0.5;
    // plane.receiveShadow = true;
    scene.add( plane );


    // ***** TEXTURES ****** //
    const bakedTexture = textureLoader.load('../assets/VRWorld/Baked.jpg')
    bakedTexture.flipY = false
    bakedTexture.encoding = THREE.sRGBEncoding;

    const characterTexture = textureLoader.load('../assets/Character/Baked.png')
    characterTexture.flipY = false
    characterTexture.encoding = THREE.sRGBEncoding;


    // Baked material
    const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

    const characterMaterial = new THREE.MeshBasicMaterial({ map: characterTexture })


    // ***** MODELS ****** //
    //World Model

    loader.load( '../assets/VRWorld/portfolio_v1(defaultmaterials).glb', function ( gltf ) {
        gltf.scene.traverse((child)=>
        {
        // console.log(child)
            // child.castShadow=true
            // child.receiveShadow=true
            child.material = bakedMaterial;
        })
        gltf.scene.scale.set(2,2,2)

        scene.add( gltf.scene );
    
    }, undefined, function ( error ) {
    
        console.error( error );
    
    } );

    //Character Model
    loader.load( './assets/Character/character3.glb', function ( gltf ) {
        gltf.scene.traverse((child)=>
        {
            child.material = characterMaterial;
            // child.castShadow=true
            // child.receiveShadow=true
        })
        const character = gltf.scene;
        character.position.set(-4,4,40)
        character.scale.set(0.5,0.5,0.5)
        scene.add( character );
    setupOrbitControls();
        characterControllerInstance=new CharacterController(character,gltf.animations,camera,controls)
    }, undefined, function ( e ) {

        console.error( e );

    });


    // ***** PHYSICS WORLD ****** //
    setupPhysicsWorld();


    
    window.addEventListener( 'resize', onWindowResize,false );

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.setSize( window.innerWidth, window.innerHeight );

}


function render() {
    // renderer.shadowMap.needsUpdate=true

    const dt = clock.getDelta();
    if ( characterControllerInstance ){
        characterControllerInstance.update(keysPressed,shiftToggle,dt);
    // console.log(characterControllerInstance.camera)
    } 
    // Update physics
    world.step(1 / 60, dt, 3);
    renderer.render( scene, camera );
    stats.update();
    requestAnimationFrame( render );
}

function setupPhysicsWorld(){
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -10, 0), // m/s²
    })
}




document.addEventListener('keydown', (e) => {
        shiftToggle=e.shiftKey;
        if (e.key in keysPressed){
            keysPressed[e.key]=true;
        }
    }, false);
document.addEventListener('keyup', (e) => {
        shiftToggle=e.shiftKey;
        if (e.key in keysPressed){
            keysPressed[e.key]=false;
        } 
    }, false);



function setupOrbitControls() {
    // Setup orbital controls
    controls = new OrbitControls(camera, renderer.domElement);
    // controls.listenToKeyEvents( window ); // optional
    controls.enableKeys = false;
    // controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    // controls.screenSpacePanning = true;
    // controls.minDistance = 200;
    // controls.maxDistance = 350;
    // controls.maxPolarAngle = Math.PI/2;
    controls.update();

}

function guiPanel() {
    const gui=new dat.GUI();
    gui.addColor(debugObject,'scenecolor')
    .onChange(()=>{
        scene.background.set(debugObject.scenecolor);
    });
    gui.addColor(debugObject,'ambientlight')
    .onChange(()=>{
        scene.children[0].color.set(debugObject.ambientlight);
    });
    
}