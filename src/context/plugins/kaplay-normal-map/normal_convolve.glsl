// cSpell: ignore texel
uniform vec2 u_texel_size;
uniform float u_strength;

uniform float u_kernel_x[KERNEL_LEN];
uniform float u_kernel_y[KERNEL_LEN];

uniform vec2 u_quad_tl;
uniform vec2 u_quad_wh;

float gray(vec4 color) {
    return dot(color.rgb, vec3(.2126, .7152, .0722));
}

float cnv1(float a[KERNEL_LEN], float b[KERNEL_LEN]) {
    float sum = 0.;
    for(int i = 0; i < KERNEL_LEN; i++) sum += a[i] * b[i];
    return sum;
}

vec4 tangentToColor(vec3 tan, float srcAlpha) {
    return vec4((tan + 1.) / 2., srcAlpha);
}

vec4 sample(sampler2D tex, vec2 uv) {
    uv = clamp(uv, u_quad_tl, (u_quad_tl + u_quad_wh));
    return texture2D(tex, uv);
}

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 pixels[KERNEL_LEN];
    for(int row = 0; row < KERNEL_SIZE; row++) {
        for(int col = 0; col < KERNEL_SIZE; col++) {
            vec2 off = float(vec2(row - KERNEL_OFFSET, col - KERNEL_OFFSET)) * u_texel_size;
            pixels[row * KERNEL_SIZE + col] = sample(tex, uv + off);
        }
    }
    float grays[KERNEL_LEN];
    for(int i = 0; i < KERNEL_LEN; i++) grays[i] = gray(pixels[i]);
    return tangentToColor(normalize(vec3(cnv1(u_kernel_x, grays), cnv1(u_kernel_y, grays), 1. / u_strength)), pixels[KERNEL_MIDDLE].a);
}
