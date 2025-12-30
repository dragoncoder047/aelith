uniform float u_nColors;
#define MAX_REPL 16
uniform vec3 u_colors_from[MAX_REPL];
uniform vec3 u_colors_to[MAX_REPL];
vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 p = def_frag();
    for(int i = 0; i < MAX_REPL; i++) {
        if(i >= int(u_nColors))
            break;
        if(distance(p.rgb, u_colors_from[i].rgb / 255.) < .01) {
            if(distance(u_colors_from[i].rgb, vec3(0.)) < .01)
                discard;
            return vec4(u_colors_to[i].rgb / 255., p.a);
        }
    }
    return p;
}
