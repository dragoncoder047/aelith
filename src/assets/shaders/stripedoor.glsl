uniform float u_time;
uniform float u_angle;
uniform float u_num_spikes;
uniform vec3 u_color;
uniform float u_amount;
const float spiketime = 1.5;
#include "rotateUV.glsl"

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec2 uv2 = rotateUV(uv, u_angle);
    float dfc = 2. * abs(uv2.y - .5);
    if ((1. - dfc) > u_amount) discard;
    else return vec4(u_color / 255., 1.) * vec4(1. - fract(u_num_spikes * abs(uv2.y - .5) + u_time / spiketime));
}
