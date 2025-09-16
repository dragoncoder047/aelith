vec2 rotateUV(vec2 uv, float rotation) {
    float cosAngle = cos(rotation);
    float sinAngle = sin(rotation);
    vec2 p = uv - vec2(0.5);
    return vec2(cosAngle * p.x + sinAngle * p.y + 0.5, cosAngle * p.y - sinAngle * p.x + 0.5);
}
