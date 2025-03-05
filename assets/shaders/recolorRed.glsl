uniform vec3 u_targetcolor;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 o_color = texture2D(tex, uv);
    if (o_color.r > .01 && o_color.g < .01 && o_color.b < .01) return vec4(u_targetcolor / 255., o_color.a);
    return o_color;
}
