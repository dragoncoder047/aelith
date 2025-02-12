import { Comp, GameObj, SpriteComp, Vec2 } from "kaplay";
import { K } from "../init";
import { TILE_SIZE } from "../constants";

export interface MergeableComp extends Comp {
    tileDims: Vec2
    squares: Vec2[]
    addSquare(pos: Vec2): void
    modifyWidth(width: number): void
    modifyHeight(width: number): void
}

export function mergeable(): MergeableComp {
    return {
        tileDims: K.vec2(1, 1),
        squares: [],
        id: "mergeable",
        add(this: GameObj<SpriteComp | MergeableComp>) {
            this.on("postprocess", () => {
                this.width = this.tileDims.x * TILE_SIZE;
                this.height = this.tileDims.y * TILE_SIZE;
            });
        },
        addSquare(pos) {
            this.squares.push(pos);
        },
        modifyWidth(width) {
            this.tileDims.x += width;
        },
        modifyHeight(height) {
            this.tileDims.y += height;
        }
    };
}
