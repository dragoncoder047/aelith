uniform vec3 u_bg_color;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 pixel = def_frag();
    if (pixel.a > 0.0) discard;
    return vec4(u_bg_color / 255., 1.);
}
