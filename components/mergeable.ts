import { Comp, GameObj, SpriteComp, Vec2 } from "kaplay";
import { K } from "../init";

export interface MergeableComp extends Comp {
    dimToAdd: Vec2

    modifyWidth(width: number): void
    modifyHeight(width: number): void
}

export function mergeable(): MergeableComp {
    return {
        dimToAdd: K.vec2(0),
        id: "mergeable",
        add(this: GameObj<SpriteComp | MergeableComp>) {
            K.onLoad(() => {
                if (this.width > 0) {
                    this.width += this.dimToAdd.x;
                    this.height += this.dimToAdd.y;
                    this.unuse("mergeable");
                }
            });
        },
        modifyWidth(width) {
            this.dimToAdd.x += width;
        },
        modifyHeight(height) {
            this.dimToAdd.y += height;
        }
    };
}