export default `

uniform float u_time;
uniform vec2 u_freq;
uniform float u_amp;
uniform float u_speed;

varying vec2 v_uv;
varying float v_elevation;

void main(){
    vec4 modelPos = modelMatrix * vec4(position, 1.0);
    
    float elevation= sin(modelPos.x * u_freq.x + u_time * u_speed) * 
                     sin(modelPos.z * u_freq.y + u_time * u_speed) * 
                     u_amp;
    modelPos.y +=elevation;  
    
    
    
    vec4 viewPos = viewMatrix * modelPos;
    vec4 projectedPos = projectionMatrix *viewPos;
    gl_Position = projectedPos;
    // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

    v_uv=uv;
    v_elevation=elevation;
}`