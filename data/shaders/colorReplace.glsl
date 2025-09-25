#define MAX_REPL 16
uniform vec3 u_colors_from[MAX_REPL];
uniform vec3 u_colors_to[MAX_REPL];
uniform float u_ncolors;
vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 o_color = texture2D(tex, uv);
    for(int i = 0; i < MAX_REPL; i++) {
        if(i >= int(u_ncolors))
            break;
        if(distance(o_color.rgb, u_colors_from[i].rgb / 255.) < .01) {
            if(distance(u_colors_from[i].rgb, vec3(0.)) < .01)
                discard;
            return vec4(u_colors_to[i].rgb / 255., o_color.a);
        }
    }
    return o_color;
}
