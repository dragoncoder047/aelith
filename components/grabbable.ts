import { AreaComp, BodyComp, Comp, GameObj, KEventController, PosComp, ZComp } from 'kaplay';
import { player } from '../player';

export interface GrabbableComp extends Comp {
    physicsFoo: KEventController | undefined
}

/**
 * Component for a grabbable object, i.e. something that
 * can be picked up by the player when clicked.
 */
export function grabbable(): GrabbableComp {
    return {
        id: "grabbable",
        require: ["area", "z", "body", "pos"],
        physicsFoo: undefined,
        add(this: GameObj<AreaComp | BodyComp | PosComp>) {
            this.onClick(() => {
                if (player.canTouch(this)) {
                    if (player.grabbing === this) {
                        player.grabbing = undefined;
                    }
                    else {
                        player.grabbing = this;
                    }
                }
            });
            this.onBeforePhysicsResolve(coll => {
                if (player.grabbing === this) coll.preventResolution();
            });
        },
        update(this: GameObj<ZComp | PosComp | BodyComp>) {
            if (player.grabbing === this) {
                this.z = Number.MAX_VALUE;
            }
            else {
                this.z = 0;
            }
        }
    };
}
