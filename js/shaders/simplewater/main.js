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
    deepcolor: 0x0000ff,
    surfacecolor: 0x8888ff
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
    camera.position.set(1,1,1);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000 );
    // scene.fog = new THREE.Fog( 0xf3f3f3, 2000, 3500 );
    scene.add( new THREE.AmbientLight( 0x111111 ) );

    const textureLoader = new THREE.TextureLoader();
    const tex= textureLoader.load('/js/three/examples/textures/lava/lavatile.jpg')


    const geometry = new THREE.PlaneBufferGeometry( 2, 2,128,128 );
    
    uniforms = {
        u_time:      {value: 1.0 },
        u_mouse:     {value: new THREE.Vector2() },
        
        u_freq:      {value: new THREE.Vector2(7,3) },
        u_amp:       {value: 0.2},
        u_speed:       {value: 1.0},

        u_colorOffset:{value: 0.25},
        u_colorMultiplier:{value: 2.0},
        u_deepcolor:     {value: new THREE.Color(debugObject.deepcolor)},
        u_surfacecolor:     {value: new THREE.Color(debugObject.surfacecolor)}
    };

    const material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs
    } );

    plane = new THREE.Mesh( geometry, material );
    plane.rotation.x= -Math.PI *0.5;
    // plane.rotation.y= -Math.PI *0.5;
    scene.add( plane );

    // debug
    gui.add(material.uniforms.u_freq.value,'x').min(0).max(20).step(0.1).name('freq_x');
    gui.add(material.uniforms.u_freq.value,'y').min(0).max(20).step(0.1).name('freq_y');
    gui.add(material.uniforms.u_amp,'value').min(0).max(1).step(0.001).name('amp');
    gui.add(material.uniforms.u_speed,'value').min(0).max(20).step(0.01).name('speed_x');
    
    gui.add(plane.position,'y').min(-3).max(3).step(0.01).name("Y-coord");
    gui.add(plane,'visible');
    gui.add(material,'wireframe');

    gui.add(material.uniforms.u_colorMultiplier,'value').min(0).max(50).step(0.001).name('col_multi');
    gui.add(material.uniforms.u_colorOffset,'value').min(0).max(1).step(0.0001).name('col_offset');
    gui.addColor(debugObject,'surfacecolor')
        .onChange(()=>{
            material.uniforms.u_surfacecolor.value.set(debugObject.surfacecolor)
        });
    gui.addColor(debugObject,'deepcolor')
        .onChange(()=>{
            material.uniforms.u_deepcolor.value.set(debugObject.deepcolor)
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
