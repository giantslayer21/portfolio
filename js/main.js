import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

import Stats from './three/examples/jsm/libs/stats.module.js';
import * as dat from './three/examples/jsm/libs/lil-gui.module.min.js';

import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';


import vs from './shaders/vertex.js';
import fs from './shaders/frag.js';

/*
* Debug
*/
const gui=new dat.GUI();
const debugObject = {
    deepcolor: 0x142e39,
    surfacecolor: 0x98caf0
}

/*
* Canvas
*/
const canvas = document.querySelector('#canvas' );
let stats,info,plane;
let camera, scene, renderer,controls,material;

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

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
        });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 500;
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far);
    camera.position.set(0,0,50);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf3f3f3 );
    scene.fog = new THREE.Fog( 0xf3f3f3, 50, 100 );
    scene.add( new THREE.AmbientLight( 0xffffff, 0.5 ) );

    const loader = new GLTFLoader();

    loader.load( '../assets/WorldModel/world.glb', function ( gltf ) {
        // gltf.scale(0.1,0.1,0.1)
        gltf.scene.position.set(0,-20,0)
        gltf.scene.rotation.set(0,20,0)
        scene.add( gltf.scene );
    
    }, undefined, function ( error ) {
    
        console.error( error );
    
    } );

        // water();
    

    orbitalcontrols();
    onWindowResize();
    window.addEventListener( 'resize', onWindowResize,false );

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.setSize( window.innerWidth, window.innerHeight );

}


function render(time) {

    time *= 0.001;  // convert time to seconds
    // material.uniforms.uTime.value = time;
    renderer.render( scene, camera );
    controls.update();// only required if controls.enableDamping = true, or if controls.autoRotate = true
    stats.update();
    requestAnimationFrame( render );
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
    // controls.enableRotate = true;
    // controls.autoRotate = true;
    // controls.autoRotateSpeed =0.1;
    controls.screenSpacePanning = true;
    // controls.minDistance = 200;
    // controls.maxDistance = 350;
    controls.maxPolarAngle = Math.PI;
    // controls.minPolarAngle = -Math.PI / 2;

}

function water() {
    const textureLoader = new THREE.TextureLoader();
    const tex= textureLoader.load('/js/three/examples/textures/lava/lavatile.jpg')


    const geometry = new THREE.PlaneBufferGeometry( 2, 2,512,512 );
    
    

    material = new THREE.ShaderMaterial( {
        vertexShader: vs,
        fragmentShader: fs,
        uniforms: {
            uTime:      {value: 1.0 },
            
            uFreq:      {value: new THREE.Vector2(4,1.5) },
            uAmp:       {value: 0.2},
            uSpeed:       {value: 0.70},
    
            uNoiseFreq: {value: 3.0},
            uNoiseAmp: {value: 0.2},
            uNoiseSpeed: {value: 0.2},
    
            uColorOffset:{value: 0.08},
            uColorMultiplier:{value: 2.0},
            uDeepColor:     {value: new THREE.Color(debugObject.deepcolor)},
            uSurfaceColor:     {value: new THREE.Color(debugObject.surfacecolor)}
        }
    } );

    plane = new THREE.Mesh( geometry, material );
    plane.rotation.x= -Math.PI *0.5;
    // plane.rotation.y= -Math.PI *0.5;
    scene.add( plane );

    // debug
    const folderMesh = gui.addFolder( 'Mesh' );
    folderMesh.add(plane.position,'y').min(-3).max(3).step(0.01).name("Y-coord");
    folderMesh.add(plane,'visible');
    folderMesh.add(material,'wireframe');
    folderMesh.open( gui._closed );

    const folderWater = gui.addFolder( 'Water' );
    folderWater.add(material.uniforms.uFreq.value,'x').min(0).max(20).step(0.1).name('freq_x');
    folderWater.add(material.uniforms.uFreq.value,'y').min(0).max(20).step(0.1).name('freq_y');
    folderWater.add(material.uniforms.uAmp,'value').min(0).max(1).step(0.0001).name('amp');
    folderWater.add(material.uniforms.uSpeed,'value').min(0).max(20).step(0.01).name('speed_x');
    folderWater.open( gui._closed );

    const folderNoise = gui.addFolder( 'Noise' );
    folderNoise.add(material.uniforms.uNoiseFreq,'value').min(0).max(10).step(0.1).name('noise_freq');
    folderNoise.add(material.uniforms.uNoiseAmp,'value').min(0).max(1).step(0.0001).name('noise_amp');
    folderNoise.add(material.uniforms.uNoiseSpeed,'value').min(0).max(1).step(0.0001).name('noise_speed');
    // folderNoise.open( gui._closed );

    const folderColor = gui.addFolder( 'Color' );
    folderColor.add(material.uniforms.uColorMultiplier,'value').min(0).max(20).step(0.001).name('col_multi');
    folderColor.add(material.uniforms.uColorOffset,'value').min(0).max(1).step(0.0001).name('col_offset');
    folderColor.addColor(debugObject,'surfacecolor')
        .onChange(()=>{
            material.uniforms.uSurfaceColor.value.set(debugObject.surfacecolor)
        });
    folderColor.addColor(debugObject,'deepcolor')
        .onChange(()=>{
            material.uniforms.uDeepColor.value.set(debugObject.deepcolor)
        });
    folderColor.open( gui._closed );

}
