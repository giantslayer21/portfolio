import * as THREE from '../js/three/build/three.module.js';
import { OrbitControls } from '../js/three/examples/jsm/controls/OrbitControls.js';

import Stats from '../js/three/examples/jsm/libs/stats.module.js';
import * as dat from '../js/three/examples/jsm/libs/lil-gui.module.min.js';

import { GLTFLoader } from '../js/three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from '../js/cannon-es.js'

import CharacterController from '../js/characterPhysics.js';


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
let stats,info;
let camera, scene, renderer,controls;
let world;
const objectsToUpdate=[];
let character,characterBoxMesh;
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
    renderer.shadowMap.enabled=true

    // ***** CAMERA ****** //
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 400;
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far);
    // camera.position.set(0,4,6)

    // ***** SCENE & FOG ****** //
    scene = new THREE.Scene();
    scene.background = new THREE.Color( debugObject.scenecolor );
    scene.fog = new THREE.FogExp2( 0x22243A,0.005);
    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.set(1024, 1024)
    directionalLight.shadow.camera.far = 15
    directionalLight.shadow.camera.left = - 7
    directionalLight.shadow.camera.top = 7
    directionalLight.shadow.camera.right = 7
    directionalLight.shadow.camera.bottom = - 7
    directionalLight.position.set(5, 5, 5)
    const dlh=new THREE.DirectionalLightHelper(directionalLight)
    scene.add(dlh)
    scene.add(directionalLight)

    

    // ***** PHYSICS WORLD ****** //
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -20, 0), // m/s²
        broadphase: new CANNON.SAPBroadphase(world),
        allowSleep: true
    })
    // Default material
    const defaultMaterial = new CANNON.Material('default')
    const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0,
            restitution: 0
        }
    )
    world.defaultContactMaterial = defaultContactMaterial
    // createSphere(1,new THREE.Vector3(0,10,0))
    /**
     * Floor
     */
    const floor = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(10, 10),
        new THREE.MeshStandardMaterial({
            color: '#777777',
            metalness: 0.3,
            roughness: 0.4,
        })
    )
    floor.receiveShadow = true
    floor.rotation.x = - Math.PI * 0.5
    scene.add(floor)
    const floorShape = new CANNON.Plane()
    const floorBody = new CANNON.Body()
    floorBody.mass = 0
    floorBody.addShape(floorShape)
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5) 
    world.addBody(floorBody)

    // const floorBox = new CANNON.Body({
    // mass: 0,
    // position: new CANNON.Vec3(0, -1, 0),
    // shape: new CANNON.Box(new CANNON.Vec3(5, 1, 5)),
    // })
    // world.addBody(floorBox)



    // Three.js mesh
    characterBoxMesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(1, 1, 1), 
        new THREE.MeshStandardMaterial({
            // metalness: 0.3,
            // roughness: 0.4,
            color: 0xff0000
        })
    );
    characterBoxMesh.castShadow = true
    characterBoxMesh.scale.set(1,4,1)
    characterBoxMesh.position.set(0,5,0)
    scene.add(characterBoxMesh)

    
    // Cannon.js WALL
    const shape = new CANNON.Box(new CANNON.Vec3(2, 1, 2))

    const body = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(5, 1, 0),
    shape: shape,
    })
    world.addBody(body)
    // Three.js WALL
    const mesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(1, 1, 1), 
        new THREE.MeshStandardMaterial({
            // metalness: 0.3,
            // roughness: 0.4,
            color: 0xffffff
        })
    );
    mesh.castShadow = true
    mesh.scale.set(4,2,4)
    mesh.position.set(0,2,0)
    scene.add(mesh)
    
    // Save in objects
    objectsToUpdate.push({mesh: mesh,body: body })

    // console.log(body.position)

    //Character Model
    const loader = new GLTFLoader();

    loader.load( './assets/Character/character3.glb', function ( gltf ) {
        character = gltf.scene;
        // character.position.set(0,14,0)
        character.scale.set(0.5,0.5,0.5)
        scene.add( character );
        setupOrbitControls();
        characterControllerInstance=new CharacterController(character,gltf.animations,camera,controls,world)
    }, undefined, function ( e ) {
        console.error( e );
    });
    

    // setupOrbitControls();
    window.addEventListener( 'resize', onWindowResize,false );

}
function collisionJumpCheck(collision){
    characterControllerInstance.canJump=true
    // console.log(characterControllerInstance.canJump,characterControllerInstance.wantsJump)
}


function render() {
    // renderer.shadowMap.needsUpdate=true
    const dt = clock.getDelta();
    // Update physics
    if(characterControllerInstance){
        characterControllerInstance.body.addEventListener('collide', collisionJumpCheck)
        characterControllerInstance.world.step(1 / 60, dt, 3);
        characterControllerInstance.update(keysPressed,shiftToggle,dt)
        // characterBoxMesh.position.copy(characterControllerInstance.body.position)
        // characterBoxMesh.quaternion.copy(characterControllerInstance.body.quaternion)
    }
    for(const object of objectsToUpdate)
    {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
    }
    
    renderer.render( scene, camera );
    stats.update();
    requestAnimationFrame( render );
}




document.addEventListener('keydown', (e) => {
        shiftToggle=e.shiftKey;
        if(e.key == ' ' && characterControllerInstance.canJump){
            // characterControllerInstance.canJump=false
            characterControllerInstance.wantsJump=true
        }
        if (e.key in keysPressed){
            keysPressed[e.key]=true;
        }
    }, false);
document.addEventListener('keyup', (e) => {
        shiftToggle=e.shiftKey;
        if (e.key in keysPressed){
            keysPressed[e.key]=false;
        }
        if(e.key == ' '){
            characterControllerInstance.wantsJump=false
            // characterControllerInstance.canJump=true
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
    controls.minDistance = 9;
    controls.maxDistance = 10;
    // controls.maxPolarAngle = Math.PI/2;
    controls.update();

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.setSize( window.innerWidth, window.innerHeight );

}