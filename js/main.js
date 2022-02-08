import * as THREE from '/js/three/build/three.module.js';
import { OrbitControls } from '/js/three/examples/jsm/controls/OrbitControls.js';

import Stats from '/js/three/examples/jsm/libs/stats.module.js';

import vs from '/js/shaders/vertex.js';
import fs from '/js/shaders/frag.js';
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
    scene.background = new THREE.Color( 0x000000 );
    // scene.fog = new THREE.Fog( 0xf3f3f3, 2000, 3500 );
    scene.add( new THREE.AmbientLight( 0x111111 ) );




    const geometry = new THREE.PlaneBufferGeometry( 1, 1,32,32 );
    // const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() }
    };
    const material = new THREE.RawShaderMaterial( {

        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,
        side: THREE.DoubleSide,
        transparent: true

    } );
    plane = new THREE.Mesh( geometry, material );
    scene.add( plane );


    orbitalcontrols();
    onWindowResize();
    window.addEventListener( 'resize', onWindowResize,false );

}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.setSize( window.innerWidth, window.innerHeight );
    // uniforms.u_resolution.value.x = renderer.domElement.width;
    // uniforms.u_resolution.value.y = renderer.domElement.height;
    uniforms.u_resolution.value.x = 900;
    uniforms.u_resolution.value.y = 900;
    console.log(renderer.domElement.width)
    console.log(renderer.domElement.height)

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
