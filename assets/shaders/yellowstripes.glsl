uniform float u_time;
uniform float u_angle;
uniform float u_num_spikes;
uniform float u_show;
const float spiketime = 1.5;

const vec4 YELLOW = vec4(1., 1., 0., 1.);

vec2 rotateUV(vec2 uv, float rotation) {
    float cosAngle = cos(rotation);
    float sinAngle = sin(rotation);
    vec2 p = uv - vec2(0.5);
    return vec2(cosAngle * p.x + sinAngle * p.y + 0.5, cosAngle * p.y - sinAngle * p.x + 0.5);
}

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    if (u_show == 0.) return vec4(0.);
    vec2 uv2 = rotateUV(uv, u_angle);
    return YELLOW * vec4(1. - fract(u_num_spikes * abs(uv2.y - .5) + u_time / spiketime));
}
