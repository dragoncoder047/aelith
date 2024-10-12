import { CompList } from "kaplay";
import { K } from "../init";
import { SCALE, TILE_SIZE } from "../constants";

export function textNote(): CompList<any> {
    var closure__textFunc: (() => string) | undefined = undefined;
    return [
        K.text("(null)", {
            font: "IBM Mono",
            size: 16 / SCALE,
            width: TILE_SIZE * 4,
            align: "left"
        }),
        K.color(K.WHITE.darken(100)),
        K.timer(),
        K.offscreen({ hide: true }),
        {
            get textFunc() {
                return closure__textFunc;
            },
            set textFunc(newFunc) {
                closure__textFunc = newFunc;
                this.recheck();
            },
            add() {
                K.onGamepadConnect(() => this.recheck());
                K.onGamepadDisconnect(() => this.recheck());
                this.recheck();
            },
            recheck() {
                if (this.textFunc) {
                    this.text = this.textFunc();
                }
            }
        }
    ]
}
