uniform float u_amount;
const vec4 BLACK = vec4(0., 0., 0., 1.);
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 p = texture2D(tex, uv);
    return mix(p, BLACK, step(rand(pos) + 0.01, u_amount * 1.01));
}
