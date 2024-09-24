import { AreaComp, BodyComp, Comp, GameObj, KEventController, LayerComp, PosComp } from 'kaplay';
import { player } from '../player';

export interface GrabbableComp extends Comp {
    physicsFoo: KEventController | undefined,
    oldLayer: string
}

/**
 * Component for a grabbable object, i.e. something that
 * can be picked up by the player when clicked.
 */
export function grabbable(): GrabbableComp {
    return {
        id: "grabbable",
        require: ["area", "body", "pos"],
        physicsFoo: undefined,
        oldLayer: "",
        add(this: GameObj<AreaComp | BodyComp | PosComp | GrabbableComp | LayerComp>) {
            this.onClick(() => {
                if (player.canTouch(this)) {
                    if (player.grabbing === this) {
                        player.grabbing = undefined;
                    }
                    else {
                        this.oldLayer = this.layer!;
                        player.grabbing = this;
                    }
                }
            });
            this.onBeforePhysicsResolve(coll => {
                if (player.grabbing === this) coll.preventResolution();
            });
        },
        update(this: GameObj<LayerComp | PosComp | BodyComp | GrabbableComp>) {
            // there must be a better way to do this
            if (player.grabbing === this) {
                this.layer = "grabbing";
            }
            else {
                if (this.oldLayer != "") this.layer = this.oldLayer;
            }
        }
    };
}
