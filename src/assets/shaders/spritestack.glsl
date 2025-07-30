vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 pix = texture2D(tex, uv);
    // simple identity to test
    return pix;
}
