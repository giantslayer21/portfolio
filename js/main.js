import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

import Stats from './three/examples/jsm/libs/stats.module.js';
import * as dat from './three/examples/jsm/libs/dat.gui.module.js';

import vs from './shaders/vertex.js';
import fs from './shaders/frag.js';

/*
* Debug
*/
const gui=new dat.GUI();
const debugObject = {
    color: 0xff0000
}

/*
* Canvas
*/
const canvas = document.querySelector('#canvas' );
let stats,info,plane;
let camera, scene, renderer,controls,uniforms;

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

    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 5;
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far);
    camera.position.z = 2;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000 );
    // scene.fog = new THREE.Fog( 0xf3f3f3, 2000, 3500 );
    scene.add( new THREE.AmbientLight( 0x111111 ) );

    const textureLoader = new THREE.TextureLoader();
    const tex= textureLoader.load('/js/three/examples/textures/lava/lavatile.jpg')


    const geometry = new THREE.PlaneBufferGeometry( 1, 1,32,32 );
    
    uniforms = {
        u_time:      {value: 1.0 },
        u_mouse:     {value: new THREE.Vector2() },
        u_freq:      {value: new THREE.Vector2(10,5) },
        u_color:     {value: new THREE.Color('orange')},
        u_tex:       {value: tex}
    };
    const material = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,
        side: THREE.DoubleSide,
        transparent: true

    } );
    plane = new THREE.Mesh( geometry, material );
    scene.add( plane );

    // debug
    gui.add(material.uniforms.u_freq.value,'x').min(0).max(20).step(1).name('freq_x');
    gui.add(material.uniforms.u_freq.value,'y').min(0).max(20).step(1).name('freq_y');

    gui
        .add(plane.position,'y')
        .min(-3)
        .max(3)
        .step(0.01)
        .name("Y-coord");
    gui
        .add(plane,'visible');

    gui
        .add(material,'wireframe');

    gui
        .addColor(debugObject,'color')
        .onChange(()=>{
            material.uniforms.u_color.value.set(debugObject.color)
        });
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
    uniforms.u_time.value = time;
    renderer.render( scene, camera );
    controls.update();// only required if controls.enableDamping = true, or if controls.autoRotate = true
    stats.update();
    requestAnimationFrame( render );
}

function orbitalcontrols() {
    // Setup orbital controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableKeys = false;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = true;
    // controls.autoRotate = true;
    controls.autoRotateSpeed =2;
    // controls.screenSpacePanning = true;
    // controls.minDistance = 200;
    // controls.maxDistance = 350;
}
