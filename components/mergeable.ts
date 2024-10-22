import { Comp, GameObj, SpriteComp } from "kaplay";
import { K } from "../init";

export interface MergeableComp extends Comp {
    widthToAdd: number
    modifyWidth(width: number): void
}

export function mergeable(): MergeableComp {
    return {
        widthToAdd: 0,
        id: "mergeable",
        add(this: GameObj<SpriteComp | MergeableComp>) {
            K.onLoad(() => {
                if (this.width > 0) {
                    this.width += this.widthToAdd;
                    this.unuse("mergeable");
                }
            });
        },
        modifyWidth(width) {
            this.widthToAdd += width;
        }
    };
}