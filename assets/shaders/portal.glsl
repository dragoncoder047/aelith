uniform float u_time;
uniform float u_staticrand;
uniform float u_angle;

#define PI 3.141592653589

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

float map(float alpha, float a, float b, float x, float y) {
    return x + (y - x) * (alpha - a) / (b - a);
}

vec2 rotateUV(vec2 uv, float rotation) {
    float cosAngle = cos(rotation);
    float sinAngle = sin(rotation);
    vec2 p = uv - vec2(0.5);
    return vec2(cosAngle * p.x + sinAngle * p.y + 0.5, cosAngle * p.y - sinAngle * p.x + 0.5);
}

float chgnoise(vec2 pos) {
    // tweak this to make it look better...
    float moving = perlin(vec3(pos.x, pos.y + u_time, u_staticrand) * 2.);
    float constant = perlin(vec3(pos, u_time) * 3.);
    return moving * constant;
}

vec3 hsv2rgb(vec3 c) {
    // from https://stackoverflow.com/a/17897228/23626926
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec2 uv2 = rotateUV(uv, u_angle);
    if(uv2.y < .0125)
        return vec4(1.);
    float alpha = cos(uv2.y * PI) * sin(uv2.x * PI);
    float noiseval = chgnoise(uv2);
    alpha *= noiseval;
    vec3 rainbow = hsv2rgb(vec3(perlin(vec3(uv2 + u_staticrand, u_time)), 1., .5));
    return vec4(rainbow * alpha, alpha);
}
