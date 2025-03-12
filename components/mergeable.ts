import { Comp, GameObj, PosComp, SpriteComp, Vec2 } from "kaplay";
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
        tileDims: K.vec2(0),
        squares: [],
        id: "mergeable",
        require: ["pos"],
        add(this: GameObj<SpriteComp | MergeableComp | PosComp>) {
            const ec1 = this.on("preprocess", () => {
                this.squares.push(this.pos);
                ec1.cancel();
            });
            const ec2 = this.on("postprocess", () => {
                this.width += this.tileDims.x * TILE_SIZE;
                this.height += this.tileDims.y * TILE_SIZE;
                ec2.cancel();
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
