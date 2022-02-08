export default `
// precision mediump float;

uniform float u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;
uniform sampler2D u_tex;

varying vec2 v_uv;
varying float v_elevation;

void main() {
    // vec4  texcolor = texture2D(u_tex, v_uv);
	gl_FragColor = vec4(v_uv,1.0,1.0);
}`