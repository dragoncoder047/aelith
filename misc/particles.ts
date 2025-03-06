import { Color, Tag, Vec2 } from "kaplay";
import { FRICTION } from "../constants";
import { K } from "../init";

export function splash(where: Vec2, color: Color | (() => Color), n = 10, yv_max = -200, ig_tags_extra: string[] = [], drag: number = 0, wf: number = 1) {
    for (var i = 0; i < n; i++) {
        makeParticle(where, color, ig_tags_extra, drag, wf).applyImpulse(K.vec2(K.rand(-100, 100), K.rand(yv_max, 0)));
    }
}

export function makeParticle(where: Vec2, color: Color | (() => Color), ig_tags_extra: string[] = [], drag: number = 0, wf: number = 1) {
    return K.add([
        K.pos(where),
        K.sprite("particle"),
        K.anchor("center"),
        K.scale(K.rand(2, 4)),
        K.layer("particles"),
        K.area({
            collisionIgnore: ["particle", "player", "box", "continuationTrap", "continuation", "bug", "grating", "portal", ...ig_tags_extra],
            friction: FRICTION
        }),
        K.body({
            gravityScale: wf,
            damping: drag
        }),
        K.lifespan(K.rand(0.5, 1)),
        K.opacity(1),
        K.shader("recolorRed", typeof color === "function" ? (() => ({ u_targetcolor: color() })) : { u_targetcolor: color }),
        "particle" as Tag,
        "raycastIgnore" as Tag,
        "noCollideWithTail" as Tag,
    ]);
}
