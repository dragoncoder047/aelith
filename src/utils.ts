import { K } from "./context";

export function hash(t: number) {
    return Math.sin(65432 * t);
}
export function hashToPoint(t: number) {
    const rand1 = hash(t);
    const rand2 = hash(rand1);
    return K.vec2(K.lerp(0, 1, rand1), K.lerp(0, 1, rand2));
}
