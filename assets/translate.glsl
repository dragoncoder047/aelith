uniform vec2 u_moveby;
uniform vec2 u_quad_topleft;
uniform vec2 u_quad_wh;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec2 uv_p = uv - (u_quad_wh * u_moveby);
    vec2 quad_botright = u_quad_topleft + u_quad_wh;
    if (uv_p.x < u_quad_topleft.x || uv_p.x > quad_botright.x
            || uv_p.y < u_quad_topleft.y || uv_p.y > quad_botright.y)
        return vec4(0, 0, 0, 0);
    return texture2D(tex, uv_p);
}
