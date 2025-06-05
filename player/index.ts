import { BodyComp, CircleComp, Color, GameObj, PosComp, RotateComp, Vec2 } from "kaplay";
import { thudder } from "../components/thudder";
import { FRICTION, JUMP_FORCE, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { PSpriteComp } from "../plugins/kaplay-sprite-play-restart";
import { playerBody } from "./body";
import { copyOpacityOfPlayer } from "./copyOpacityOfPlayer";
import { playerHead } from "./head";
import { tail } from "./tail";

export const player = K.add([
    playerBody(),
    K.sprite("player_body") as PSpriteComp,
    K.layer("player"),
    "player",
    K.pos(0, 0),
    K.health(16, 16),
    K.timer(),
    K.opacity(1),
    K.area({
        /**/
        shape: new K.Polygon([
            K.vec2(0, -TILE_SIZE - 0.5),
            K.vec2(TILE_SIZE / 2, -TILE_SIZE / 2),
            K.vec2(TILE_SIZE / 2, TILE_SIZE / 2),
            K.vec2(-0.1, TILE_SIZE - 0.5),
            K.vec2(0.1, TILE_SIZE - 0.5),
            K.vec2(-TILE_SIZE / 2, TILE_SIZE / 2),
            K.vec2(-TILE_SIZE / 2, -TILE_SIZE / 2),
        ]),
        /**/
        friction: FRICTION,
        restitution: RESTITUTION,
    }),
    K.body({ jumpForce: JUMP_FORCE, maxVelocity: TERMINAL_VELOCITY }),
    K.anchor("center"),
    K.state<"normal" | "jump" | "climbing">("normal"),
    "raycastIgnore"
]);
// why is this necessary out here?
player.use(thudder(undefined, { detune: -500 }, (): boolean => !player.intersectingAny("button")));

player.head = K.add([
    playerHead(),
    K.sprite("player_head"),
    K.layer("player"),
    K.pos(),
    K.body({ isStatic: true }),
    K.rotate(0),
    K.opacity(1),
    K.anchor("center"),
    copyOpacityOfPlayer(),
]) as any;

//------------------------------------------------------------

// Add tail
addChain(player, K.vec2(0, 8), 8, 4, K.WHITE, 2, 50, 1 / 2);
// Add horn on back of head
addChain(player.head!, K.vec2(13, -1), 3, 2.7, K.WHITE, 10, 100, 1 / 3);


function addChain(start: GameObj<PosComp>, startPos: Vec2, nSeg: number, maxSz: number, color: Color, damping: number, springDamping: number, lenFactor: number) {
    var previous: GameObj<PosComp | RotateComp | CircleComp> = start as any;
    var pos = K.vec2(0, TILE_SIZE / 2);
    for (var i = 0; i < nSeg; i++) {
        const sz = K.lerp(1, maxSz, (1 - (i / nSeg)) ** 2);
        previous = K.add([
            K.circle(sz / 2),
            K.layer("playerTail"),
            K.opacity(0),
            K.pos(pos),
            K.area({
                collisionIgnore: ["player", "tail", "noCollideWithTail"],
                friction: FRICTION / 10,
                restitution: 0,
            }),
            K.body({
                mass: 0.1,
                damping,
                maxVelocity: TERMINAL_VELOCITY
            }),
            K.spring({
                other: previous as any as GameObj<BodyComp | PosComp>,
                springConstant: 100,
                springDamping,
                dampingClamp: 100,
                length: sz * lenFactor + (previous?.radius ?? sz * lenFactor),
                p2: previous === start ? startPos : K.vec2(0),
                forceOther: previous !== start,
                drawOpts: {
                    width: sz,
                    color,
                },
            }),
            tail(start, startPos),
            copyOpacityOfPlayer(),
            "tail",
            "raycastIgnore",
        ]) as any;
        pos = pos.add(K.vec2(0, sz));
    }
}
