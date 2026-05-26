#include "perlin.glsl"

uniform float u_time;

const vec3 RED = vec3(1., 0., 0.);
const vec4 GREEN = vec4(0., .3, 0., 1.);
const vec4 SPARK = vec4(.8, .9, 1., 1.);

vec4 lit_frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 o_color = def_frag();
    vec4 wire_color = mix(GREEN, SPARK, pow(perlin(vec3(pos / 10., u_time)), 10.));
    if(distance(RED, o_color.rgb) < .01)
        return wire_color;
    return o_color;
}
