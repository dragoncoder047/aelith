import { Vec2 } from "kaplay";
import { K } from "./context";

export function hash(t: number) {
    const v = Math.sin(65432 * t);
    return (.5 + Math.asin(v) / Math.PI) % 1;
}
export function hashToPoint(t: number) {
    const rand1 = hash(t);
    const rand2 = hash(rand1);
    return K.vec2(K.lerp(-1, 1, rand1), K.lerp(-1, 1, rand2));
}

export function javaHash(s: string) {
    var hash = 0;
    for (var i = 0; i < s.length; i++) {
        hash = (Math.imul(hash, 31) + s.charCodeAt(i)) | 0;
    }
    return hash;
}

function cantor(x: number, y: number) {
    // From https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
    return (((x + y) * (x + y + 1)) >> 1) + y;
}

export function hashPoint(p: Vec2) {
    return hash(cantor(p.x, p.y));
}
