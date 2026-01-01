uniform float u_nColors;
uniform vec3 u_source;
#define MAX_COLORS 8
uniform vec3 u_colors[MAX_COLORS];
uniform float u_quad_width;
uniform float u_quad_height;
uniform float u_barwidth;
uniform float u_time;
float window(int start, float where) {
    float ss = float(start);
    return where < (ss + 1.) && where >= ss ? 1. : 0.;
}
vec4 lit_frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 p = def_frag();
    if(distance(p.rgb, u_source / 255.) < .01) {
        float which = mod(u_time + dot(uv, vec2(u_quad_width, u_quad_height)) / u_barwidth, u_nColors);
        vec3 sum = vec3(0.);
        for (int i = 0; i < MAX_COLORS; i++) sum += window(i, which) * u_colors[i];
        return vec4(sum, p.a);
    }
    return p;
}
