uniform float u_time;
uniform vec2 u_quadSz;
uniform vec2 u_offset;

#define CELL_SIZE 10.

float N21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
}

vec2 N22(vec2 p) {
    float n = N21(p);
    return vec2(n, N21(p + n));
}

vec4 lit_frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {

    uv = uv * u_quadSz + u_offset;

    uv = uv / CELL_SIZE;

    // normalize uv to be cell grid
    vec2 intpos = floor(uv);
    vec2 frac = fract(uv);

    // find a random position for the star position
    vec2 p = N22(intpos);

    // find a random twinkle factor
    float scale = N21(intpos);
    float beta = floor(u_time * scale);
    float alpha = fract(u_time * scale);
    float a = N21(vec2(beta, 0));
    float b = N21(vec2(beta + 1., 0));
    float p1 = N21(intpos + a);
    float p2 = N21(intpos + b);

    // final position
    float twinkle = mix(p1, p2, alpha);

    // find radius so that star fits in cell
    vec2 q = min(p, 1. - p);
    float r = min(q.x, q.y);

    // find the resultant radius
    float d = distance(frac, p) / pow(twinkle, 2.) / r;

    // make a star from tha radius
    float c = smoothstep(.6, .4, d);

    c = c * 0.93 + 0.07;

    return vec4(vec3(c), 1.);
}
