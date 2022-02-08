export default `
// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// uniform mat4 modelMatrix;

uniform float u_time;
uniform vec2 u_freq;

// attribute vec3 position;
// attribute vec2 uv;

varying vec2 v_uv;
varying float v_elevation;

void main(){
    vec4 modelPos = modelMatrix * vec4(position, 1.0);

    float elevation= sin ( modelPos.x * u_freq.x -u_time) *0.1;
    elevation += sin ( modelPos.y * u_freq.y -u_time) *0.1;
    modelPos.z +=elevation;  
    
    vec4 viewPos = viewMatrix * modelPos;
    vec4 projectedPos = projectionMatrix *viewPos;
    
    gl_Position = projectedPos;
    // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

    v_uv=uv;
    v_elevation= elevation;
}`