uniform vec3 u_targetcolor;
uniform float u_time;
uniform float u_octave;
uniform float u_staticrand;
uniform float u_pixamt;

// perlin noise function from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83

float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 perm(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float perlin(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

vec2 pixelate(vec2 x, float by) {
    return floor(x * by) / by;
}

float pixelate(float x, float by) {
    return floor(x * by) / by;
}

float map(float alpha, float a, float b, float x, float y) {
    return x + (y - x) * (alpha - a) / (b - a);
}

float chgnoise(vec2 pos) {
    // tweak this to make it look better...
    float moving = perlin(vec3(pos.x, pos.y + u_time, u_staticrand) * u_octave);
    float constant = perlin(vec3(pos, u_time) * u_octave * 1.5);
    return moving * constant * 2.;
}

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    uv = pixelate(uv, u_pixamt);
    float alpha = (1. - uv.y) * sin(uv.x * 3.141592653589);
    float noiseval = chgnoise(uv);
    // alpha = 1.;
    return vec4(u_targetcolor, pixelate(noiseval * alpha, u_pixamt));
}
