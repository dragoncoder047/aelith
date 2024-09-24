import { Comp, GameObj, KEventController } from "kaplay";

export interface LinkComp extends Comp {
    readonly idTag: string,
    tag: string,
    broadcast(msg: string): void,
    onMessage(cb: (msg: string) => void): KEventController,
}

/**
 * Component that links two game objects by messages
 * @param tag ID of linked objects
 */
export function linked(tag: string): LinkComp {
    var closure__tag = tag;
    return {
        id: "linked",
        get idTag() { return "__linkid_" + closure__tag; },
        get tag() { return closure__tag; },
        set tag(newTag) {
            (this as unknown as GameObj).unuse(this.idTag); // cSpell: ignore unuse
            closure__tag = newTag;
            (this as unknown as GameObj).use(this.idTag);
        },
        add(this: GameObj) {
            this.use(this.idTag);
        },
        broadcast(this: GameObj, msg: string) {
            this.query({
                hierarchy: "siblings",
                include: this.idTag,
            }).concat(this).forEach(sibling => {
                sibling.trigger("message", msg);
            });
        },
        onMessage(this: GameObj, cb: (msg: string) => void): KEventController {
            return this.on("message", cb);
        }
    };
}
