uniform vec4 u_targetcolor;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 o_color = texture2D(tex, uv);
    if (o_color.r > 0.0 && o_color.g == 0.0 && o_color.b == 0.0) return vec4(u_targetcolor.rgb, o_color.a);
    return o_color;
}
