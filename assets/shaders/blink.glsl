uniform vec3 u_color;
uniform float u_mixamt;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 pixel = texture2D(tex, uv);
    return pixel; // this doesn't work
    vec4 mc = vec4(u_color, 1);
    pixel = mix(pixel, mc, u_mixamt);
    return pixel;
}
