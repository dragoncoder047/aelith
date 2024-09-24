import { GameObj, SpriteComp, BodyComp, AreaComp, Collision, Comp, PosComp } from "kaplay";
import K from "../init";
import { player } from "../player";

export interface BoxComp extends Comp {
    hittingPlayer: boolean,
    wasHittingPlayer: boolean,
}

export function boxComp(): BoxComp {
    return {
        hittingPlayer: false,
        require: ["body"],
        wasHittingPlayer: false,
        add(this: GameObj<SpriteComp | BodyComp | AreaComp | BoxComp | PosComp>) {
            setTimeout(() => this.frame = K.randi(this.numFrames()), 10); // give time for frame data to load
            this.onBeforePhysicsResolve((coll: Collision) => {
                if (this === player.grabbing) {
                    this.hittingPlayer = true;
                    coll.preventResolution();
                }
                if (coll.target === player && this.wasHittingPlayer) {
                    this.hittingPlayer = true;
                }
                if (this.hittingPlayer) {
                    coll.preventResolution();
                }
            });
        },
        draw() {
            this.wasHittingPlayer = this.hittingPlayer;
            this.hittingPlayer = false;
        }
    };
}
