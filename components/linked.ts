import { Comp, GameObj, KEventController, PosComp } from "kaplay";
import { K } from "../init";

export interface LinkComp extends Comp {
    readonly idTag: string,
    linkGroup: string,
    broadcast(msg: string): void,
    onMessage(cb: (msg: string) => void): KEventController,
}

/**
 * Component that links two game objects by messages
 * @param tag ID of linked objects
 */
export function linked(tag: string): LinkComp {
    var _grp = tag;
    return {
        id: "linked",
        require: ["pos"],
        get idTag() { return "__linkid_" + _grp; },
        get linkGroup() { return _grp; },
        set linkGroup(newTag) {
            (this as unknown as GameObj).untag(this.idTag);
            _grp = newTag;
            (this as unknown as GameObj).tag(this.idTag);
        },
        add(this: GameObj) {
            this.tag(this.idTag);
        },
        broadcast(this: GameObj<PosComp | LinkComp>, msg: string) {
            const self = this;
            this.trigger("broadcasted", msg);
            const targets = K.get(this.idTag, { recursive: true });
            targets.forEach(target => {
                target.trigger("message", msg);
                if (target === this) return;
                const FADE_TIME = 0.25;
                const start = K.time();
                if ((!("opacity" in this) || (this as any).opacity > 0) && target.exists() && !target.paused)
                    K.add([
                        {
                            draw(this: GameObj) {
                                const o = K.lerp(1, 0, (K.time() - start) / FADE_TIME);
                                if (o < 0) {
                                    this.destroy();
                                    return;
                                }
                                K.drawLine({
                                    p1: self.pos,
                                    p2: target.pos,
                                    width: 2,
                                    color: K.WHITE,
                                    opacity: o,
                                });
                            },
                        }
                    ]);
            });
        },
        onMessage(this: GameObj, cb: (msg: string) => void): KEventController {
            return this.on("message", cb);
        },
        inspect() {
            return `link ID: ${this.linkGroup}`;
        }
    };
}
