uniform float u_moveby;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    if (uv.y <= u_moveby) return vec4(0, 0, 0, 0);
    uv -= vec2(0, u_moveby);
    return texture2D(tex, uv);
}
