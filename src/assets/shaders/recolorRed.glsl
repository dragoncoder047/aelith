uniform vec3 u_targetcolor;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 o_color = texture2D(tex, uv);
    if(distance(o_color.rgb, vec3(1., 0., 0.)) < 0.05)
        return vec4(u_targetcolor / 255. * o_color.a, o_color.a);
    return o_color;
}
