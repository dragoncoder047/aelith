import { BodyComp, GameObj, OpacityComp, PosComp } from "kaplay";
import { thudder } from "../components/thudder";
import { FRICTION, JUMP_FORCE, RESTITUTION, TERMINAL_VELOCITY, TILE_SIZE } from "../constants";
import { K } from "../init";
import { SpringComp } from "../plugins/kaplay-springs";
import { playerBody, PlayerBodyComp } from "./body";

export const player = K.add([
    playerBody(),
    K.sprite("player"),
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
    K.state("normal"),
    {
        draw(this: GameObj<PosComp | PlayerBodyComp>) {
            const h = this.holdingItem;
            if (h) {
                // draw the item again on top
                K.pushTransform();
                K.pushMatrix((this as any).localTransform.inverse); // weird math
                K.pushTranslate(h.parent ? h.parent.worldTransform.transformVector(h.worldPos()!, K.vec2(0)) : K.vec2(0));
                K.pushTranslate(this.worldPos()!.sub(h.worldPos()!));
                h.draw();
                K.popTransform();
            }
        }
    },
    "raycastIgnore"
]);
// why is this necessary out here?
player.use(thudder(undefined, { detune: -500 }, (): boolean => !player.intersectingAny("button")));

// @ts-expect-error
window.player = player;

//------------------------------------------------------------

// add tail
var previous: GameObj = player;
var pos = K.vec2(0, TILE_SIZE / 2);
const numTailSegments = 8;
const maxTailSize = 4;
const tailColor = K.WHITE;
for (var i = 0; i < numTailSegments; i++) {
    const sz = K.lerp(1, maxTailSize, (1 - (i / numTailSegments)) ** 2);
    previous = K.add([
        K.circle(sz / 2),
        K.layer("playerTail"),
        K.opacity(0),
        K.pos(pos),
        K.anchor("center"),
        K.area({
            collisionIgnore: ["player", "tail", "noCollideWithTail"],
            friction: FRICTION / 10,
            restitution: 0
        }),
        K.body({
            mass: 0.1,
            damping: 0.1
        }),
        K.spring({
            other: previous as GameObj<BodyComp | PosComp>,
            springConstant: 100,
            springDamping: 50,
            dampingClamp: 100,
            length: sz / 2 + (previous?.radius ?? sz / 2),
            p2: K.vec2(0, previous === player ? 8 : 0),
            forceOther: previous !== player,
            drawOpts: {
                // @ts-expect-error
                width: sz,
                color: tailColor,
            },
        }),
        "tail",
        "raycastIgnore",
        {
            update(this: GameObj<OpacityComp | SpringComp>) {
                this.hidden = player.hidden || player.opacity === 0;
                this.drawOpts.opacity = player.opacity;
            }
        }
    ]);
    pos = pos.add(K.vec2(0, sz));
}
