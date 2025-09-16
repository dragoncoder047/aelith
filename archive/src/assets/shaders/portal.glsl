uniform float u_time;
uniform float u_staticrand;
uniform float u_angle;

#define PI 3.141592653589
#define HALF_PI (PI / 2.)
#include "perlin.glsl"
#include "rotateUV.glsl"

float map(float alpha, float a, float b, float x, float y) {
    return x + (y - x) * (alpha - a) / (b - a);
}

float chgnoise(vec2 pos) {
    // tweak this to make it look better...
    float moving = perlin(vec3(pos.x, pos.y + u_time, u_staticrand) * 2.);
    float constant = perlin(vec3(pos, u_time) * 3.);
    return moving * constant;
}

const vec4 HSV_MAGIC = vec4(1., 2. / 3., 1. / 3., 3.);
vec3 hsv2rgb(vec3 c) {
    // from https://stackoverflow.com/a/17897228/23626926
    vec3 p = abs(fract(c.xxx + HSV_MAGIC.xyz) * 6. - HSV_MAGIC.www);
    return c.z * mix(HSV_MAGIC.xxx, clamp(p - HSV_MAGIC.xxx, 0., 1.), c.y);
}

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec2 uv2 = rotateUV(uv, u_angle);
    if(uv2.y < .03125)
        return vec4(1.);
    float alpha = sin(HALF_PI * (1. - uv2.y) * sin(uv2.x * PI));
    float noiseval = chgnoise(uv2);
    alpha *= sqrt(noiseval);
    vec3 rainbow = hsv2rgb(vec3(perlin(vec3(uv2 + u_staticrand, u_time)), 1., .5));
    return vec4(rainbow, 1.) * vec4(alpha);
}
