uniform float u_amount;
uniform float u_time;
const vec4 BLACK = vec4(0., 0., 0., 1.);
#define MAX_BOX 100
#define WIBBLE_SCALE .06
#define COLOR_SCALE 10.

float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
float rand(float f) {
    return rand(vec2(u_time, f * rand(vec2(f, f))));
}
vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 c = BLACK;
    vec2 oRed = vec2(0.);
    vec2 oGrn = vec2(0.);
    vec2 oBlu = vec2(0.);
    float amSq = u_amount * u_amount;
    for(int i = 0; i < MAX_BOX; i++) {
        float f = float(i);
        if(i > int(u_amount * float(MAX_BOX)))
            break;
        float left = rand(f);
        float width = rand(left) * u_amount;
        float top = rand(f + u_time);
        float height = rand(top) * u_amount;
        float amt1 = (rand(height) - .5) * amSq;
        float amt2 = (rand(amt1) - .5) * amSq;
        float amt3 = (rand(amt2) - .5) * amSq;
        float amt4 = (rand(amt3) - .5) * amSq;
        float amt5 = (rand(amt4) - .5) * amSq;
        float amt6 = (rand(amt5) - .5) * amSq;
        float amt7 = (rand(amt6) - .5) * amSq;
        float amt8 = (rand(amt7) - .5) * amSq;
        float amt9 = (rand(amt8) - .5) * amSq;
        if(uv.x > (left - width / 2.) && uv.x <= (left + width / 2.) && uv.y > (top - height / 2.) && uv.y <= (top + height / 2.)) {
            c.r += amt1;
            oRed += vec2(amt2, amt3);
            c.g += amt4;
            oGrn += vec2(amt5, amt6);
            c.b += amt7;
            oBlu += vec2(amt8, amt9);
        }
    }
    float r = texture2D(tex, uv + oRed * WIBBLE_SCALE).r;
    float g = texture2D(tex, uv + oGrn * WIBBLE_SCALE).g;
    float b = texture2D(tex, uv + oBlu * WIBBLE_SCALE).b;
    float a = texture2D(tex, uv).a;
    vec4 p = vec4(r, g, b, a);
    return (vec4(1.) - (c * COLOR_SCALE)) * (1. - smoothstep(0., 1., u_amount)) * p;
}
