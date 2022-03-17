import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

import Stats from './three/examples/jsm/libs/stats.module.js';
import * as dat from './three/examples/jsm/libs/lil-gui.module.min.js';

import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';


import vs from './shaders/vertex.js';
import fs from './shaders/frag.js';

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
let camera, scene, renderer,controls,material;
let actions,mixer,activeAction, previousAction;

let characterControllerInstance;
const DIRECTIONS=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
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
    const far = 500;
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far);

    // ***** SCENE & FOG ****** //
    scene = new THREE.Scene();
    scene.background = new THREE.Color( debugObject.scenecolor );
    scene.fog = new THREE.FogExp2( 0x22243A,0.003);

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

    setupOrbitControls();


    // ***** GEOMETRIES ****** //
    // const sphereGeometry = new THREE.SphereGeometry( 5, 32, 32 );
    // const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
    // const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    // sphere.position.set(0,20,10)
    // sphere.castShadow = true; //default is false
    // sphere.receiveShadow = false; //default
    // scene.add( sphere );

    const geometry = new THREE.PlaneBufferGeometry( 1024, 1024 );
    plane = new THREE.Mesh( geometry, new THREE.MeshStandardMaterial({color: 0x22243a}) );
    plane.rotation.x= -Math.PI *0.5;
    plane.receiveShadow = true;
    scene.add( plane );


    // ***** TEXTURES ****** //
    const bakedTexture = textureLoader.load('../assets/VRWorld/Baked.jpg')
    bakedTexture.flipY = false
    bakedTexture.encoding = THREE.sRGBEncoding;


    // Baked material
    const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })


    // ***** MODELS ****** //
    //World Model

    loader.load( '../assets/VRWorld/portfolio_v1(defaultmaterials).glb', function ( gltf ) {
        gltf.scene.traverse((child)=>
        {
            child.material = bakedMaterial;
        })
        gltf.scene.scale.set(2,2,2)
        scene.add( gltf.scene );
    
    }, undefined, function ( error ) {
    
        console.error( error );
    
    } );

    //Character Model
    loader.load( './assets/Character/character3.glb', function ( gltf ) {

        const character = gltf.scene;
        character.position.set(-4,4,40)
        character.scale.set(0.5,0.5,0.5)
        scene.add( character );
        characterControllerInstance=new CharacterController(character,gltf.animations,camera,controls)
    }, undefined, function ( e ) {

        console.error( e );

    });

    
    window.addEventListener( 'resize', onWindowResize,false );

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.setSize( window.innerWidth, window.innerHeight );

}


function render() {

    const dt = clock.getDelta();
    if ( characterControllerInstance ){
        characterControllerInstance.update(keysPressed,shiftToggle,dt);
    // console.log(characterControllerInstance.camera)

    } 
    renderer.render( scene, camera );
    controls.update();// only required if controls.enableDamping = true, or if controls.autoRotate = true
    stats.update();
    requestAnimationFrame( render );
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

class CharacterController{

    // temporary data
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion= new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()
    
    // constants
    fadeDuration= 0.2
    runVelocity = 20
    walkVelocity = 7

    constructor(character,animations,camera,orbitControls){
        this.character = character;
        this.actions = {};
        this.mixer = new THREE.AnimationMixer( character );
        this.setupCharacterAnimations(animations );
        this.currentAction='idle'
        this.camera = camera;
        this.camera.position.x=this.character.position.x;
        this.camera.position.y=this.character.position.y+4;
        this.camera.position.z=this.character.position.z+10;
        this.orbitControls = orbitControls;
        this.updateCameraTarget(0,0);
    }

    update( keysPressed, shiftToggle,delta) {

        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true)
        var play = 'idle';
        if (directionPressed && shiftToggle) {
            play = 'run'
        } else if (directionPressed) {
            play = 'walk'
        }

        this.fadeToAction(play)
        this.mixer.update(delta)

        if (this.currentAction == 'run' || this.currentAction == 'walk') {
            // calculate towards camera direction
            var angleYCameraDirection = Math.atan2(
                    (this.camera.position.x - this.character.position.x), 
                    (this.camera.position.z - this.character.position.z))
            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed)

            // rotate character
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
            this.character.quaternion.rotateTowards(this.rotateQuarternion, 0.2)

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // run/walk velocity
            const velocity = this.currentAction == 'run' ? this.runVelocity : this.walkVelocity

            // move character & camera
            const moveX = -this.walkDirection.x * velocity * delta
            const moveZ = -this.walkDirection.z * velocity * delta
            this.character.position.x += moveX
            this.character.position.z += moveZ
            this.updateCameraTarget(moveX, moveZ)
        }
    }
    updateCameraTarget(moveX, moveZ) {
        // move camera
        this.camera.position.x += moveX
        this.camera.position.z += moveZ

        // update camera target
        this.cameraTarget.x = this.character.position.x
        this.cameraTarget.y = this.character.position.y + 1
        this.cameraTarget.z = this.character.position.z
        this.orbitControls.target = this.cameraTarget
    }
    fadeToAction( actionName ) {

        const previousAction = this.currentAction;
        this.currentAction = actionName;
    
        if ( previousAction !== this.currentAction ) {
    
            this.actions[previousAction].fadeOut(0.5);
            this.actions[this.currentAction]
            .reset()
            .setEffectiveTimeScale( 1 )
            .setEffectiveWeight( 1 )
            .play();
        }
    }
    setupCharacterAnimations( animations ) {
        // const states = [ 'catch','death','fall','guard','hit','hit_guard','idle','interact','jump_start','pull','push','put','run','throw','walk'];
        for ( let i = 0; i < animations.length; i ++ ) {
            const clip = animations[ i ];
            const action = this.mixer.clipAction( clip );
            this.actions[ clip.name ] = action;    
        }
        this.currentAction = 'idle' ;
        this.actions[this.currentAction].play();
    }
    directionOffset(keysPressed) {
        var directionOffset = 0 // w

        if (keysPressed['ArrowDown']) {
            if (keysPressed['ArrowRight']) {
                directionOffset  = Math.PI / 4 // w+a
            } else if (keysPressed['ArrowLeft']) {
                directionOffset = - Math.PI / 4 // w+d
            }
        } else if (keysPressed['ArrowUp']) {
            if (keysPressed['ArrowRight']) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed['ArrowLeft']) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed['ArrowRight']) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed['ArrowLeft']) {
            directionOffset = - Math.PI / 2 // d
        }

        return directionOffset
    }

}









function setupOrbitControls() {
    // Setup orbital controls
    controls = new OrbitControls(camera, renderer.domElement);
    // controls.listenToKeyEvents( window ); // optional

    controls.enableKeys = false;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    // controls.minDistance = 200;
    // controls.maxDistance = 350;
    controls.maxPolarAngle = Math.PI/2;
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