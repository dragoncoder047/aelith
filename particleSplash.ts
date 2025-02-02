import { Color, Tag, Vec2 } from "kaplay";
import { FRICTION } from "./constants";
import { K } from "./init";

export function splash(where: Vec2, color: Color | (() => Color), n = 10, yv_max = -200, ig_tags_extra: string[] = []) {
    for (var i = 0; i < n; i++) {
        K.add([
            K.pos(where),
            K.sprite("particle"),
            K.anchor("center"),
            K.scale(K.rand(2, 4)),
            K.layer("ui"),
            K.area({
                collisionIgnore: ["particle", "player", "box", "continuationTrap", "continuation", "bug", "grating", "barrier", ...ig_tags_extra],
                friction: FRICTION
            }),
            K.body(),
            K.lifespan(K.rand(0.5, 1)),
            K.opacity(1),
            K.shader("recolor-red", typeof color === "function" ? (() => ({ u_targetcolor: color() })) : { u_targetcolor: color }),
            "particle" as Tag,
            "raycastIgnore" as Tag,
            "noCollideWithTail" as Tag,
        ]).applyImpulse(K.vec2(K.rand(-100, 100), K.rand(yv_max, 0)));
    }
}
