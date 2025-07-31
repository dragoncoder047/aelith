const float amount = 0.01;
const int steps = 256;
const float tile_size = 32.;
uniform vec2 u_size;

const vec2 middle = vec2(.5);

bool is_pixel(vec4 pix) {
    return length(pix.rgb) > 0.01;
}

vec2 scale_uv(float by, vec2 uv) {
    return middle + (uv - middle) * by;
}

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 pix = texture2D(tex, uv);
    if (is_pixel(pix)) return pix;
    for (int i = 0; i < steps; i++) {
        float f = float(i) / float(tile_size);
        float growfactor = mix(1., 1. + amount, f);
        vec2 nextUV = scale_uv(growfactor, uv);
        vec4 pixel = texture2D(tex, nextUV);
        if (is_pixel(pixel)) return pixel;
    }
    return vec4(0.);
}
