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
let camera, scene, renderer,controls,materia;
let actions,mixer,activeAction, previousAction;
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
    camera.position.set(20,6,10);

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



    // ***** GEOMETRIES ****** //
    const sphereGeometry = new THREE.SphereGeometry( 5, 32, 32 );
    const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
    const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    sphere.position.set(0,20,20)
    // sphere.castShadow = true; //default is false
    // sphere.receiveShadow = false; //default
    scene.add( sphere );

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
        gltf.scene.position.set(0,-2,0)
        scene.add( gltf.scene );
    
    }, undefined, function ( error ) {
    
        console.error( error );
    
    } );

    //Character Model
    loader.load( './assets/Character/character3.glb', function ( gltf ) {

        const character = gltf.scene;
        // character.position.set(0,20,0)
        scene.add( character );
        mixer = new THREE.AnimationMixer( character );

        setupCharacterAnimations( character, gltf.animations );
    }, undefined, function ( e ) {

        console.error( e );

    });

    
    orbitalcontrols();
    window.addEventListener( 'resize', onWindowResize,false );

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.setSize( window.innerWidth, window.innerHeight );

}


function render(time) {

    // material.uniforms.uTime.value = time;
    const dt = clock.getDelta();
    if ( mixer ){
        mixer.update( dt );
        if(DIRECTIONS.some(key=>keysPressed[key] == true)){
            if(shiftToggle)fadeToAction('run')
            else fadeToAction('walk')
        }
        else{
            fadeToAction('idle')
        }
        if (keysPressed[' '])fadeToAction('jump_start')
    } 

    renderer.render( scene, camera );
    controls.update();// only required if controls.enableDamping = true, or if controls.autoRotate = true
    stats.update();
    requestAnimationFrame( render );
}


const DIRECTIONS=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']
const keysPressed = {ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false, ' ':false}
let shiftToggle=false;
document.addEventListener('keydown', (e) => {
        shiftToggle=e.shiftKey
        if (e.key in keysPressed){
            keysPressed[e.key]=true
        }
    }, false);
document.addEventListener('keyup', (e) => {
        shiftToggle=e.shiftKey
        // console.log(e)
        if (e.key in keysPressed){
            keysPressed[e.key]=false
        } 
    }, false);

class CharacterController{
    constructor(){

    }
}





function setupCharacterAnimations( character, animations ) {

    // const states = [ 'catch','death','fall','guard','hit','hit_guard','idle','interact','jump_start','pull','push','put','run','throw','walk'];
                
    actions = {};

    for ( let i = 0; i < animations.length; i ++ ) {

        const clip = animations[ i ];
        const action = mixer.clipAction( clip );
        actions[ clip.name ] = action;
        console.log(clip.name)

    }
    activeAction = actions[ 'idle' ];
    activeAction.play();

}

function fadeToAction( name ) {

    previousAction = activeAction;
    activeAction = actions[ name ];

    if ( previousAction !== activeAction ) {

        previousAction.fadeOut(0.5);
        activeAction
        .reset()
        .setEffectiveTimeScale( 1 )
        .setEffectiveWeight( 1 )
        .play();
        // activeAction.crossFadeFrom(previousAction,0.5,true).play();

    }
}

function orbitalcontrols() {
    // Setup orbital controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents( window ); // optional

    controls.enableKeys = false;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    // controls.minDistance = 200;
    // controls.maxDistance = 350;
    controls.maxPolarAngle = Math.PI/2;

}

function guiPanel() {
    const gui=new dat.GUI();
    gui.addColor(debugObject,'scenecolor')
    .onChange(()=>{
        scene.background.set(debugObject.scenecolor)
    });
    gui.addColor(debugObject,'ambientlight')
    .onChange(()=>{
        scene.children[0].color.set(debugObject.ambientlight)
    });
    
}