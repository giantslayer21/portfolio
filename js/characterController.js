import * as THREE from './three/build/three.module.js';
const DIRECTIONS=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];

export default


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
        this.camera.position.z=this.character.position.z+5;
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
            this.orbitControls.update();// only required if controls.enableDamping = true, or if controls.autoRotate = true 
        }
    }
    updateCameraTarget(moveX, moveZ) {
        // move camera
        this.camera.position.x += moveX
        this.camera.position.z += moveZ
        // if (this.camera.position.y<4){
        //     this.camera.position.y=10
        // }

        // update camera target
        this.cameraTarget.x = this.character.position.x
        this.cameraTarget.y = this.character.position.y+3
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
                directionOffset  = Math.PI / 4 
            } else if (keysPressed['ArrowLeft']) {
                directionOffset = - Math.PI / 4 
            }
        } else if (keysPressed['ArrowUp']) {
            if (keysPressed['ArrowRight']) {
                directionOffset = Math.PI / 4 + Math.PI / 2 
            } else if (keysPressed['ArrowLeft']) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 
            } else {
                directionOffset = Math.PI 
            }
        } else if (keysPressed['ArrowRight']) {
            directionOffset = Math.PI / 2 
        } else if (keysPressed['ArrowLeft']) {
            directionOffset = - Math.PI / 2 
        }

        return directionOffset
    }

}

