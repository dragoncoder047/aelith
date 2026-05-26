uniform float u_flash_strength;
vec4 lit_frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 a = def_frag();
    return vec4(mix(a.rgb, vec3(1.), u_flash_strength), a.a);
}
