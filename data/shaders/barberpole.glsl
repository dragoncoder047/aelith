uniform float u_nColors;
#define MAX_COLORS 8
uniform vec3 u_colors[MAX_COLORS];
uniform vec2 u_quadsize;
uniform vec2 u_framesize;
uniform float u_barwidth;
uniform float u_time;
float window(int start, float where) {
    float ss = float(start);
    return where < (ss + 1.) && where >= ss ? 1. : 0.;
}
vec4 lit_frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 p = def_frag();
    vec2 xy = uv * u_framesize / u_quadsize;
    float which = mod(u_time - (xy.x + xy.y) / u_barwidth, u_nColors);
    vec3 sum = vec3(0.);
    for(int i = 0; i < MAX_COLORS; i++) {
        if(float(i) >= u_nColors)
            break;
        sum += window(i, which) * u_colors[i];
    }
    return vec4(sum / 255., 1.) * p.a;
}
